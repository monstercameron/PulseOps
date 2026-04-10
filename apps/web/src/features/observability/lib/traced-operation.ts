import {
  trace,
  type Span,
  type SpanStatusCode,
  SpanStatusCode as SpanStatusCodeValue,
} from "@opentelemetry/api";

export async function runTracedOperation<ResultType>(
  name: string,
  operation: () => Promise<ResultType>,
): Promise<ResultType> {
  const tracer = trace.getTracer("bizopsaccelerator");

  return tracer.startActiveSpan(name, (span) =>
    runSpanOperation<ResultType>(span, operation),
  ) as Promise<ResultType>;
}

async function runSpanOperation<ResultType>(
  span: Span,
  operation: () => Promise<ResultType>,
): Promise<ResultType> {
  try {
    const result = await operation();

    span.setStatus({
      code: SpanStatusCodeValue.OK,
    });

    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCodeValue.ERROR as SpanStatusCode,
    });
    throw error;
  } finally {
    span.end();
  }
}
