// Erro de servidor com código do protocolo (vira ack {ok:false}).
import type { ErrorPayload, ServerErrorCode } from '@war/shared';

export class ServerError extends Error {
  constructor(
    public readonly code: ServerErrorCode,
    message: string,
    public readonly ruleCode?: string,
  ) {
    super(message);
    this.name = 'ServerError';
  }
  toPayload(): ErrorPayload {
    return this.ruleCode ? { code: this.code, message: this.message, ruleCode: this.ruleCode } : { code: this.code, message: this.message };
  }
}
