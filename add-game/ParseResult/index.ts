import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { GameData, PlayerPosition } from "../shared/types";

const parse = (input: string): GameData => {
  const positions: PlayerPosition[] = [];
  for (const match of input.matchAll(/(?<pos>\d+):\s*<(?<id>@\w*)\|\w*>/g)) {
    const { pos, id } = match.groups;
    positions.push({
      player: id,
      position: Number.parseInt(pos),
    });
  }
  return {
    playerPositions: positions,
  };
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");
  const { text } = req.body;
  const responseMessage = parse(text);

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};

export default httpTrigger;
