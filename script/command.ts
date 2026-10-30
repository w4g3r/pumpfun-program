import { config } from './config';
import { launch } from './launch';
import { buy } from './buy';
import { sell } from './sell';

const USAGE = `Usage:
  yarn script config
  yarn script launch [-n <name>] [-s <symbol>] [-u <uri>]
  yarn script buy -t <TOKEN_MINT> -a <SOL_AMOUNT>
  yarn script sell -t <TOKEN_MINT> -a <TOKEN_AMOUNT>

Network and wallet come from ANCHOR_PROVIDER_URL and ANCHOR_WALLET in .env`;

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!key.startsWith('-') || value === undefined || value.startsWith('-')) {
      throw new Error(`Invalid argument near "${key}"\n\n${USAGE}`);
    }
    flags[key] = value;
  }
  return flags;
}

function required(flags: Record<string, string>, key: string, name: string): string {
  const value = flags[key];
  if (!value) throw new Error(`Missing ${name} (${key})\n\n${USAGE}`);
  return value;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);

  switch (command) {
    case 'config':
      return config();
    case 'launch':
      return launch({ name: flags['-n'], symbol: flags['-s'], uri: flags['-u'] });
    case 'buy':
      return buy(required(flags, '-t', 'token mint'), required(flags, '-a', 'SOL amount'));
    case 'sell':
      return sell(required(flags, '-t', 'token mint'), required(flags, '-a', 'token amount'));
    default:
      console.log(USAGE);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
