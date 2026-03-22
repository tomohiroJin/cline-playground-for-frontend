import { Physics } from '../physics';
import { Config } from '../config';
import { EffectType } from '../constants';
import { buildPlayer, buildInputState, buildRamp } from './helpers/test-factories';

describe('Physics', () => {
  describe('applyMovement', () => {
    describe('正常系', () => {
      it('入力なしの場合、速度の方向にのみ移動する', () => {
        // Arrange
        const player = buildPlayer({ x: 200, vx: 0 });
        const input = buildInputState();
        const speed = 5;
        const dir = 1 as const;

        // Act
        const result = Physics.applyMovement(player, input, speed, dir);

        // Assert
        expect(result.x).toBe(200 + dir * speed * 1.2);
        expect(result.vx).toBe(0);
      });

      it('右入力で右方向に加速する', () => {
        // Arrange
        const player = buildPlayer({ x: 200, vx: 0 });
        const input = buildInputState({ right: true });
        const speed = 5;
        const dir = 1 as const;

        // Act
        const result = Physics.applyMovement(player, input, speed, dir);

        // Assert
        const expectedVx = Config.physics.moveAccel * Config.physics.friction;
        expect(result.vx).toBeCloseTo(expectedVx);
      });

      it('左入力で左方向に加速する', () => {
        // Arrange
        const player = buildPlayer({ x: 200, vx: 0 });
        const input = buildInputState({ left: true });
        const speed = 5;
        const dir = 1 as const;

        // Act
        const result = Physics.applyMovement(player, input, speed, dir);

        // Assert
        const expectedVx = -Config.physics.moveAccel * Config.physics.friction;
        expect(result.vx).toBeCloseTo(expectedVx);
      });

      it('dir が -1 の場合、逆方向に移動する', () => {
        // Arrange
        const player = buildPlayer({ x: 200, vx: 0 });
        const input = buildInputState();
        const speed = 5;
        const dir = -1 as const;

        // Act
        const result = Physics.applyMovement(player, input, speed, dir);

        // Assert
        expect(result.x).toBe(200 + dir * speed * 1.2);
      });

      it('摩擦により速度が減衰する', () => {
        // Arrange
        const player = buildPlayer({ x: 200, vx: 10 });
        const input = buildInputState();
        const speed = 0;
        const dir = 1 as const;

        // Act
        const result = Physics.applyMovement(player, input, speed, dir);

        // Assert
        const expectedVx = 10 * Config.physics.friction;
        expect(result.vx).toBeCloseTo(expectedVx);
      });
    });

    describe('境界値', () => {
      it('左端のマージンにクランプされる', () => {
        // Arrange
        const player = buildPlayer({ x: 0, vx: -100 });
        const input = buildInputState();
        const speed = 0;
        const dir = 1 as const;

        // Act
        const result = Physics.applyMovement(player, input, speed, dir);

        // Assert
        expect(result.x).toBe(Config.player.moveMargin);
      });

      it('右端のマージンにクランプされる', () => {
        // Arrange
        const player = buildPlayer({ x: Config.screen.width, vx: 100 });
        const input = buildInputState();
        const speed = 0;
        const dir = 1 as const;

        // Act
        const result = Physics.applyMovement(player, input, speed, dir);

        // Assert
        expect(result.x).toBe(
          Config.screen.width - Config.player.moveMargin
        );
      });
    });
  });

  describe('applyJump', () => {
    describe('正常系', () => {
      it('ジャンプ入力で地上にいる場合、ジャンプが発生する', () => {
        // Arrange
        const player = buildPlayer({ onGround: true, jumpCD: 0 });
        const input = buildInputState({ jump: true });

        // Act
        const result = Physics.applyJump(player, input, undefined, 0);

        // Assert
        expect(result.didJump).toBe(true);
        expect(result.player.jumping).toBe(true);
        expect(result.player.onGround).toBe(false);
      });

      it('ジャンプ時に上方向の速度が設定される', () => {
        // Arrange
        const player = buildPlayer({ onGround: true, jumpCD: 0 });
        const input = buildInputState({ jump: true });

        // Act
        const result = Physics.applyJump(player, input, undefined, 0);

        // Assert
        // ジャンプ直後に重力が適用され、vy が更新される
        expect(result.player.vy).toBe(
          Config.jump.power + Config.physics.gravity
        );
      });

      it('強制ジャンプエフェクトでジャンプが発生する', () => {
        // Arrange
        const player = buildPlayer({ onGround: true, jumpCD: 0 });
        const input = buildInputState();
        const effTimer = Config.effect.forceJumpInterval; // interval の倍数

        // Act
        const result = Physics.applyJump(
          player,
          input,
          EffectType.FORCE_JUMP,
          effTimer
        );

        // Assert
        expect(result.didJump).toBe(true);
        // 強制ジャンプは forcedPower を使用
        expect(result.player.vy).toBe(
          Config.jump.forcedPower + Config.physics.gravity
        );
      });

      it('ジャンプ中に重力が適用されて y 座標が変化する', () => {
        // Arrange
        const player = buildPlayer({
          jumping: true,
          vy: -5,
          y: -10,
          onGround: false,
        });
        const input = buildInputState();

        // Act
        const result = Physics.applyJump(player, input, undefined, 0);

        // Assert
        const expectedVy = -5 + Config.physics.gravity;
        const expectedY = -10 + expectedVy;
        expect(result.player.vy).toBeCloseTo(expectedVy);
        expect(result.player.y).toBeCloseTo(expectedY);
      });

      it('着地時に y=0 にリセットされジャンプ状態が解除される', () => {
        // Arrange: y が正になるような状態（着地する直前）
        const player = buildPlayer({
          jumping: true,
          vy: 5,
          y: -2,
          onGround: false,
        });
        const input = buildInputState();

        // Act
        const result = Physics.applyJump(player, input, undefined, 0);

        // Assert
        expect(result.player.y).toBe(0);
        expect(result.player.vy).toBe(0);
        expect(result.player.jumping).toBe(false);
        expect(result.player.jumpCD).toBe(Config.jump.landingCooldown - 1);
      });

      it('jumpCD が 0 以下でジャンプしていない場合、onGround が true になる', () => {
        // Arrange
        const player = buildPlayer({
          jumpCD: 1,
          jumping: false,
          onGround: false,
        });
        const input = buildInputState();

        // Act
        const result = Physics.applyJump(player, input, undefined, 0);

        // Assert
        // jumpCD は 1 から 0 にデクリメントされ、onGround が true になる
        expect(result.player.jumpCD).toBe(0);
        expect(result.player.onGround).toBe(true);
      });
    });

    describe('異常系', () => {
      it('ジャンプ入力があってもクールダウン中はジャンプしない', () => {
        // Arrange
        const player = buildPlayer({ onGround: true, jumpCD: 5 });
        const input = buildInputState({ jump: true });

        // Act
        const result = Physics.applyJump(player, input, undefined, 0);

        // Assert
        expect(result.didJump).toBe(false);
      });

      it('空中ではジャンプ入力が無視される', () => {
        // Arrange
        const player = buildPlayer({ onGround: false, jumpCD: 0 });
        const input = buildInputState({ jump: true });

        // Act
        const result = Physics.applyJump(player, input, undefined, 0);

        // Assert
        expect(result.didJump).toBe(false);
      });

      it('強制ジャンプのインターバルに合わない場合はジャンプしない', () => {
        // Arrange
        const player = buildPlayer({ onGround: true, jumpCD: 0 });
        const input = buildInputState();
        const effTimer = Config.effect.forceJumpInterval + 1; // インターバルに合わない

        // Act
        const result = Physics.applyJump(
          player,
          input,
          EffectType.FORCE_JUMP,
          effTimer
        );

        // Assert
        expect(result.didJump).toBe(false);
      });
    });
  });

  describe('checkTransition', () => {
    describe('正常系', () => {
      it('dir=1 で右端に到達した場合、次のランプに遷移する', () => {
        // Arrange
        const width = Config.screen.width;
        const player = buildPlayer({
          x: width - Config.ramp.transitionMargin,
          ramp: 0,
        });
        const ramps = [
          buildRamp({ dir: 1 }),
          buildRamp({ dir: -1 }),
        ];

        // Act
        const result = Physics.checkTransition(player, ramps, width);

        // Assert
        expect(result.transitioned).toBe(true);
        expect(result.player.ramp).toBe(1);
      });

      it('dir=-1 で左端に到達した場合、次のランプに遷移する', () => {
        // Arrange
        const width = Config.screen.width;
        const player = buildPlayer({
          x: Config.ramp.transitionMargin,
          ramp: 0,
        });
        const ramps = [
          buildRamp({ dir: -1 }),
          buildRamp({ dir: 1 }),
        ];

        // Act
        const result = Physics.checkTransition(player, ramps, width);

        // Assert
        expect(result.transitioned).toBe(true);
        expect(result.player.ramp).toBe(1);
      });

      it('遷移時に次のランプの開始位置に配置される', () => {
        // Arrange
        const width = Config.screen.width;
        const player = buildPlayer({
          x: width - Config.ramp.transitionMargin,
          ramp: 0,
        });
        const ramps = [
          buildRamp({ dir: 1 }),
          buildRamp({ dir: 1 }),
        ];

        // Act
        const result = Physics.checkTransition(player, ramps, width);

        // Assert
        // 次のランプの dir が 1 なので startOffset
        expect(result.player.x).toBe(Config.ramp.startOffset);
        expect(result.player.y).toBe(0);
      });

      it('最後のランプの端に到達した場合、isGoal が true になる', () => {
        // Arrange
        const width = Config.screen.width;
        const player = buildPlayer({
          x: width - Config.ramp.transitionMargin,
          ramp: 0,
        });
        const ramps = [buildRamp({ dir: 1 })];

        // Act
        const result = Physics.checkTransition(player, ramps, width);

        // Assert
        expect(result.transitioned).toBe(false);
        expect(result.isGoal).toBe(true);
      });
    });

    describe('異常系', () => {
      it('端に到達していない場合、遷移しない', () => {
        // Arrange
        const width = Config.screen.width;
        const player = buildPlayer({ x: width / 2, ramp: 0 });
        const ramps = [buildRamp({ dir: 1 }), buildRamp({ dir: -1 })];

        // Act
        const result = Physics.checkTransition(player, ramps, width);

        // Assert
        expect(result.transitioned).toBe(false);
      });

      it('ジャンプ中は端に到達しても遷移しない', () => {
        // Arrange
        const width = Config.screen.width;
        const player = buildPlayer({
          x: width - Config.ramp.transitionMargin,
          ramp: 0,
          jumping: true,
        });
        const ramps = [buildRamp({ dir: 1 }), buildRamp({ dir: -1 })];

        // Act
        const result = Physics.checkTransition(player, ramps, width);

        // Assert
        expect(result.transitioned).toBe(false);
      });
    });
  });
});
