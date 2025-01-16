import {
  AuthenticatorInterface,
  passThroughInterceptor,
} from '@apimatic/core-interfaces';

export const customQueryAuthenticationProvider = ({
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
      request.url +=
        (request.url.indexOf('?') === -1 ? '?' : '&') +
        encodeQueryParams({ token, 'api-key': apiKey });
      return next(request, options);
    };
  };
};
function encodeQueryParams(queryParams: Record<string, string>) {
  const queryString: string[] = [];
  for (const key of Object.keys(queryParams)) {
    queryString.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`
    );
  }
  return queryString.join('&');
}
