import {
  AuthenticatorInterface,
  passThroughInterceptor,
} from '@apimatic/core-interfaces';
import { mergeHeaders } from '@apimatic/http-headers';

export const customHeaderAuthenticationProvider = ({
  token,
  apiKey,
}: {
  token: string;
  apiKey: string;
}): AuthenticatorInterface<boolean> => {
  return (requiresAuth?: boolean) => {
    if (!requiresAuth) {
      return passThroughInterceptor;
    }

    return (request, options, next) => {
      const customHeaderParams = {
        token,
        'api-key': apiKey,
      };
      request.headers = request.headers ?? {};
      mergeHeaders(request.headers, customHeaderParams);

      return next(request, options);
    };
  };
};
