import { getRequestConfig } from "next-intl/server";

const locale = "pt-BR";

export default getRequestConfig(async () => {
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
