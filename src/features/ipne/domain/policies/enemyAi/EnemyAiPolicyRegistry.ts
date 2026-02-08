import { Enemy } from '../../../types';
import { EnemyAiPolicy, EnemyAiUpdateContext } from './types';

export class EnemyAiPolicyRegistry {
  private readonly policies: EnemyAiPolicy[] = [];

  register(policy: EnemyAiPolicy): void {
    this.policies.push(policy);
  }

  resolvePolicy(type: Enemy['type']): EnemyAiPolicy | undefined {
    return this.policies.find(policy => policy.supports(type));
  }

  update(context: EnemyAiUpdateContext): Enemy {
    const policy = this.resolvePolicy(context.enemy.type);
    if (!policy) {
      return context.enemy;
    }
    return policy.update(context);
  }
}
