import { FieldError } from "../generated/graphql";

export default (errors: FieldError[]) => {
  // `Record<string, string>` defines a homogeneous object type by defining the key type, and the value type.
  const errorMap: Record<string, string> = {};

  errors.forEach((err) => {
    errorMap[err.field] = err.message;
  });

  return errorMap;
}
