import { BadRequestException, ValidationError } from '@nestjs/common';

// Walks the (possibly nested) validation errors and keeps the first message per
// field, for example { email: 'Enter a valid email address' }.
function collectFieldErrors(
  errors: ValidationError[],
  parentPath: string,
  out: Record<string, string>,
) {
  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    if (error.constraints) {
      out[path] = Object.values(error.constraints)[0];
    }
    if (error.children?.length) {
      collectFieldErrors(error.children, path, out);
    }
  }
}

/**
 * Used as the ValidationPipe's exceptionFactory. Returns every invalid field,
 * so a form can show each message under the right input:
 *   { statusCode: 400, error: 'validation_failed', message, fieldErrors: { email: '...' } }
 */
export function buildValidationException(errors: ValidationError[]) {
  const fieldErrors: Record<string, string> = {};
  collectFieldErrors(errors, '', fieldErrors);
  return new BadRequestException({
    error: 'validation_failed',
    message: 'Please check the highlighted fields.',
    fieldErrors,
  });
}