import { AzureFunction, Context, HttpRequest } from "@azure/functions";

type SlackFormElement = {
  key: string;
  value: string;
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");
  const elements: SlackFormElement[] = req.body;
  const res = {};
  elements.forEach(({ key, value }) => {
    res[key] = value;
  });

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: res,
  };
};

export default httpTrigger;
