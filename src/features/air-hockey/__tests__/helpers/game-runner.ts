/**
 * ゲームループランナー
 * - ゲームループを複数フレーム実行するテストヘルパー
 * - Canvas / Audio なしで純粋にドメインロジックを実行
 * - ドメインイベントを収集して検証可能に
 */
import type { GameState, FieldConfig, ItemType, Puck, GamePhase, ObstacleState } from '../../core/types';
import type { AiBehaviorConfig } from '../../core/story-balance';
import type { GameEvent } from '../../domain/events/game-events';
import { createEventDispatcher } from '../../domain/events/game-events';
import { DomainPhysics } from '../../domain/services/physics';
import { DomainCpuAI } from '../../domain/services/ai';
import { ItemEffectRegistry } from '../../domain/services/item-effect';
import { Scoring, type Score } from '../../domain/services/scoring';
import { PHYSICS_CONSTANTS } from '../../domain/constants/physics';
import { DOMAIN_ITEMS } from '../../domain/constants/items';
import { EntityFactory } from '../../core/entities';

/** プレイヤー入力 */
type PlayerInput = {
  x: number;
  y: number;
};

/**
 * ゲームループランナー
 * ゲームループを純粋関数として複数フレーム実行し、
 * ドメインレベルでの正しさを検証する
 */
export class GameRunner {
  private state: GameState;
  private events: GameEvent[] = [];
  private _frameCount = 0;
  private score: Score;
  private phase: GamePhase = 'playing';
  private winScore: number;
  private field: FieldConfig;
  private dispatcher = createEventDispatcher();
  private effectRegistry = new ItemEffectRegistry();

  constructor(
    field: FieldConfig,
    private readonly aiConfig: AiBehaviorConfig,
    initialState?: Partial<GameState> & { winScore?: number }
  ) {
    this.field = field;
    this.winScore = initialState?.winScore ?? 5;
    const { winScore: _ws, ...stateOverrides } = initialState ?? {};
    this.state = {
      ...EntityFactory.createGameState(undefined, field),
      // 時間依存を排除して決定的に
      lastItemSpawn: 0,
      fever: { active: false, lastGoalTime: 0, extraPucks: 0 },
      ...stateOverrides,
    };
    this.score = Scoring.create();

    // イベント収集
    this.dispatcher.subscribe((event) => {
      this.events.push(event);
    });
  }

  // ── 実行メソッド ──────────────────────────────

  /** 指定フレーム数だけゲームループを実行する */
  runFrames(frames: number, input?: PlayerInput): void {
    for (let i = 0; i < frames; i++) {
      if (this.phase === 'finished') break;
      this.stepFrame(input);
      this._frameCount++;
    }
  }

  /** 特定条件を満たすまでゲームループを実行する */
  runUntil(
    predicate: (state: GameState) => boolean,
    maxFrames = 600
  ): void {
    for (let i = 0; i < maxFrames; i++) {
      if (predicate(this.state)) break;
      if (this.phase === 'finished') break;
      this.stepFrame();
      this._frameCount++;
    }
  }

  // ── 状態取得メソッド ──────────────────────────────

  /** 現在のゲーム状態を取得する */
  getState(): GameState {
    return this.state;
  }

  /** 現在のスコアを取得する */
  getScore(): Score {
    return this.score;
  }

  /** 現在のフェーズを取得する */
  getPhase(): GamePhase {
    return this.phase;
  }

  /** 収集されたイベントを取得する */
  getEvents(): ReadonlyArray<GameEvent> {
    return this.events;
  }

  /** 特定タイプのイベントを取得する */
  getEventsOfType<T extends GameEvent['type']>(
    type: T
  ): Extract<GameEvent, { type: T }>[] {
    return this.events.filter(
      (e): e is Extract<GameEvent, { type: T }> => e.type === type
    );
  }

  /** フレーム数を取得する */
  getFrameCount(): number {
    return this._frameCount;
  }

  // ── 状態操作メソッド（テスト用） ──────────────────────────────

  /** パック位置を設定する */
  setPuckPosition(index: number, x: number, y: number): void {
    const pucks = [...this.state.pucks];
    if (pucks[index]) {
      pucks[index] = { ...pucks[index], x, y };
      this.state = { ...this.state, pucks };
    }
  }

  /** パック速度を設定する */
  setPuckVelocity(index: number, vx: number, vy: number): void {
    const pucks = [...this.state.pucks];
    if (pucks[index]) {
      pucks[index] = { ...pucks[index], vx, vy };
      this.state = { ...this.state, pucks };
    }
  }

  /** 障害物の状態を設定する */
  setObstacleState(index: number, obstacleState: ObstacleState): void {
    const obstacles = [...this.state.obstacleStates];
    if (index < obstacles.length) {
      obstacles[index] = { ...obstacleState };
      this.state = { ...this.state, obstacleStates: obstacles };
    }
  }

  /** アイテムを配置する */
  spawnItem(type: ItemType, x: number, y: number): void {
    const template = DOMAIN_ITEMS.find((item) => item.id === type);
    if (!template) return;

    const item = {
      id: template.id,
      name: template.name,
      color: template.color,
      icon: template.icon,
      x,
      y,
      vx: 0,
      vy: 0,
      r: PHYSICS_CONSTANTS.ITEM_RADIUS,
    };

    this.state = {
      ...this.state,
      items: [...this.state.items, item],
    };

    this.dispatcher.dispatch({
      type: 'ITEM_SPAWNED',
      itemType: type,
      x,
      y,
    });
  }

  // ── フレーム処理（プライベート） ──────────────────────────────

  /** 1フレーム分のゲームループを実行する */
  private stepFrame(input?: PlayerInput): void {
    const now = this._frameCount * 16; // 疑似タイムスタンプ（16ms/フレーム）

    this.updateInput(input);
    this.updateCpuAI(now);
    this.processObstacleRespawn(now);

    const updatedPucks = this.updatePucks();
    const afterObstacles = this.processObstacleCollisions(updatedPucks, now);
    const afterGoals = this.processGoals(afterObstacles);
    const afterMallets = this.processMalletCollisions(afterGoals);

    this.processItemCollisions(now);

    this.state = {
      ...this.state,
      pucks: afterMallets,
    };
  }

  /** プレイヤー入力をマレット位置に反映する */
  private updateInput(input?: PlayerInput): void {
    if (input) {
      this.state = {
        ...this.state,
        player: { ...this.state.player, x: input.x, y: input.y },
      };
    }
  }

  /** CPU AI でマレット位置を更新する */
  private updateCpuAI(now: number): void {
    const cpuResult = DomainCpuAI.updateWithBehavior(
      this.state, this.aiConfig, now
    );
    if (cpuResult) {
      this.state = {
        ...this.state,
        cpu: cpuResult.cpu,
        cpuTarget: cpuResult.cpuTarget,
        cpuTargetTime: cpuResult.cpuTargetTime,
        cpuStuckTimer: cpuResult.cpuStuckTimer,
      };
    }
  }

  /** 破壊された障害物のリスポーンを処理する */
  private processObstacleRespawn(now: number): void {
    if (!this.field.destructible || !this.field.obstacleRespawnMs) return;

    const respawnMs = this.field.obstacleRespawnMs;
    const updatedObstacles = this.state.obstacleStates.map((obs) => {
      if (obs.destroyed && now - obs.destroyedAt >= respawnMs) {
        return { ...obs, hp: obs.maxHp, destroyed: false, destroyedAt: 0 };
      }
      return obs;
    });
    this.state = { ...this.state, obstacleStates: updatedObstacles };
  }

  /** パックの位置・速度・壁バウンスを更新する */
  private updatePucks(): Puck[] {
    const dt = 1;
    const puckRadius = PHYSICS_CONSTANTS.PUCK_RADIUS;
    const goalSize = this.field.goalSize;

    return this.state.pucks.map((puck) => {
      let p = { ...puck };

      // 速度適用
      p = { ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt };

      // 摩擦適用
      const friction = PHYSICS_CONSTANTS.FRICTION;
      p = { ...p, vx: p.vx * friction, vy: p.vy * friction };

      // 壁バウンス
      const goalLeft = (PHYSICS_CONSTANTS.CANVAS_WIDTH - goalSize) / 2;
      const goalRight = (PHYSICS_CONSTANTS.CANVAS_WIDTH + goalSize) / 2;
      const isInGoalX = (x: number) => x >= goalLeft && x <= goalRight;

      const bounced = DomainPhysics.applyWallBounce(
        p,
        puckRadius,
        isInGoalX,
        () => {
          this.dispatcher.dispatch({ type: 'WALL_BOUNCE', x: p.x, y: p.y });
        }
      );
      p = { ...p, ...bounced };

      return p;
    });
  }

  /** パックと障害物の衝突を処理する */
  private processObstacleCollisions(pucks: Puck[], now: number): Puck[] {
    if (this.field.obstacles.length === 0) return pucks;

    const puckRadius = PHYSICS_CONSTANTS.PUCK_RADIUS;
    const result = [...pucks];

    for (let pi = 0; pi < result.length; pi++) {
      let puck = result[pi];
      for (let oi = 0; oi < this.field.obstacles.length; oi++) {
        const obstacle = this.field.obstacles[oi];
        const obsState = this.state.obstacleStates[oi];
        if (!obsState || obsState.destroyed) continue;

        const collision = DomainPhysics.detectCollision(
          puck.x, puck.y, puckRadius,
          obstacle.x, obstacle.y, obstacle.r
        );
        if (collision) {
          // パックを反射
          const reflected = DomainPhysics.reflectOffSurface(puck, collision);
          puck = { ...puck, ...reflected };
          result[pi] = puck;

          // 障害物のHP減少
          const newHp = obsState.hp - 1;
          const newObstacles = [...this.state.obstacleStates];
          if (newHp <= 0) {
            newObstacles[oi] = { ...obsState, hp: 0, destroyed: true, destroyedAt: now };
            this.dispatcher.dispatch({
              type: 'OBSTACLE_DESTROYED',
              x: obstacle.x,
              y: obstacle.y,
            });
          } else {
            newObstacles[oi] = { ...obsState, hp: newHp };
          }
          this.state = { ...this.state, obstacleStates: newObstacles };
        }
      }
    }

    return result;
  }

  /** ゴール判定・スコア加算・コンボ管理・勝利判定を処理する */
  private processGoals(pucks: Puck[]): Puck[] {
    const remainingPucks: Puck[] = [];

    for (const puck of pucks) {
      const goalResult = this.checkGoal(puck);
      if (goalResult) {
        const scorer = goalResult;
        this.score = Scoring.addScore(this.score, scorer);
        this.dispatcher.dispatch({
          type: 'GOAL_SCORED',
          scorer,
          speed: Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy),
        });

        this.updateCombo(scorer);
        this.checkWinner();

        // ゴール後にパックをリセット
        remainingPucks.push({
          x: PHYSICS_CONSTANTS.CANVAS_WIDTH / 2,
          y: PHYSICS_CONSTANTS.CANVAS_HEIGHT / 2,
          vx: 0,
          vy: 1.5,
          visible: true,
          invisibleCount: 0,
        });
      } else {
        remainingPucks.push(puck);
      }
    }

    return remainingPucks;
  }

  /** フィーバー発動のコンボ閾値 */
  private static readonly FEVER_COMBO_THRESHOLD = 3;

  /** コンボの更新・フィーバー判定・イベント発行 */
  private updateCombo(scorer: 'player' | 'cpu'): void {
    const combo = this.state.combo;
    if (combo.lastScorer === scorer) {
      const newCount = combo.count + 1;
      this.state = {
        ...this.state,
        combo: { count: newCount, lastScorer: scorer },
      };
      if (newCount >= 2) {
        this.dispatcher.dispatch({ type: 'COMBO_INCREASED', count: newCount });
      }
      // フィーバー発動判定
      if (newCount >= GameRunner.FEVER_COMBO_THRESHOLD && !this.state.fever.active) {
        this.state = {
          ...this.state,
          fever: { ...this.state.fever, active: true },
        };
        this.dispatcher.dispatch({ type: 'FEVER_ACTIVATED' });
      }
    } else {
      this.state = {
        ...this.state,
        combo: { count: 1, lastScorer: scorer },
        fever: { ...this.state.fever, active: false },
      };
    }
  }

  /** 勝利判定とフェーズ遷移 */
  private checkWinner(): void {
    const winner = Scoring.getWinner(this.score, this.winScore);
    if (winner) {
      this.phase = 'finished';
      this.dispatcher.dispatch({
        type: 'PHASE_CHANGED',
        from: 'playing',
        to: 'finished',
      });
    }
  }

  /** マレットとパックの衝突を処理する */
  private processMalletCollisions(pucks: Puck[]): Puck[] {
    const puckRadius = PHYSICS_CONSTANTS.PUCK_RADIUS;
    const malletRadius = PHYSICS_CONSTANTS.MALLET_RADIUS;

    return pucks.map((puck) => {
      // プレイヤーマレットとの衝突
      const playerCollision = DomainPhysics.detectCollision(
        puck.x, puck.y, puckRadius,
        this.state.player.x, this.state.player.y, malletRadius
      );
      if (playerCollision) {
        const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
        this.dispatcher.dispatch({
          type: 'COLLISION',
          objectA: 'puck',
          objectB: 'player',
          speed,
          x: puck.x,
          y: puck.y,
        });
        return DomainPhysics.resolveCollision(
          puck, playerCollision,
          Math.min(speed + 3, PHYSICS_CONSTANTS.MAX_POWER),
          this.state.player.vx, this.state.player.vy
        );
      }

      // CPU マレットとの衝突
      const cpuCollision = DomainPhysics.detectCollision(
        puck.x, puck.y, puckRadius,
        this.state.cpu.x, this.state.cpu.y, malletRadius
      );
      if (cpuCollision) {
        const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
        this.dispatcher.dispatch({
          type: 'COLLISION',
          objectA: 'puck',
          objectB: 'cpu',
          speed,
          x: puck.x,
          y: puck.y,
        });
        return DomainPhysics.resolveCollision(
          puck, cpuCollision,
          Math.min(speed + 3, PHYSICS_CONSTANTS.MAX_POWER),
          this.state.cpu.vx, this.state.cpu.vy
        );
      }

      return puck;
    });
  }

  /** アイテムとマレットの衝突を処理する */
  private processItemCollisions(now: number): void {
    const malletRadius = PHYSICS_CONSTANTS.MALLET_RADIUS;
    const remainingItems = [...this.state.items];

    for (let i = remainingItems.length - 1; i >= 0; i--) {
      const item = remainingItems[i];
      // プレイヤーマレットとの衝突
      const playerCollision = DomainPhysics.detectCollision(
        item.x, item.y, item.r,
        this.state.player.x, this.state.player.y, malletRadius
      );
      if (playerCollision) {
        this.dispatcher.dispatch({
          type: 'ITEM_COLLECTED',
          itemType: item.id,
          collector: 'player',
        });
        this.state = this.effectRegistry.apply(item.id, this.state, 'player', now);
        remainingItems.splice(i, 1);
        continue;
      }
      // CPU マレットとの衝突
      const cpuCollision = DomainPhysics.detectCollision(
        item.x, item.y, item.r,
        this.state.cpu.x, this.state.cpu.y, malletRadius
      );
      if (cpuCollision) {
        this.dispatcher.dispatch({
          type: 'ITEM_COLLECTED',
          itemType: item.id,
          collector: 'cpu',
        });
        this.state = this.effectRegistry.apply(item.id, this.state, 'cpu', now);
        remainingItems.splice(i, 1);
      }
    }

    this.state = { ...this.state, items: remainingItems };
  }

  /** ゴール判定 */
  private checkGoal(puck: Puck): 'player' | 'cpu' | null {
    const goalSize = this.field.goalSize;
    const goalLeft = (PHYSICS_CONSTANTS.CANVAS_WIDTH - goalSize) / 2;
    const goalRight = (PHYSICS_CONSTANTS.CANVAS_WIDTH + goalSize) / 2;
    const inGoalX = puck.x >= goalLeft && puck.x <= goalRight;

    if (!inGoalX) return null;

    const puckRadius = PHYSICS_CONSTANTS.PUCK_RADIUS;
    // プレイヤー側ゴール（下端）→ CPU がスコア
    if (puck.y > PHYSICS_CONSTANTS.CANVAS_HEIGHT - puckRadius) return 'cpu';
    // CPU 側ゴール（上端）→ プレイヤーがスコア
    if (puck.y < puckRadius) return 'player';

    return null;
  }
}
