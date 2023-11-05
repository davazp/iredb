import { computation } from ".";

const expensiveSquare = computation("squarev1", async (x: number) => {
  console.log(`Squaring ${x}...`);
  await delay(10000);
  console.log(`Squaring ${x}...done`);
  return x * x;
});

const expensiveSum = computation(
  "sumv1",
  async ({ x, y }: { x: number; y: number }) => {
    console.log(`Adding ${x} and ${y}...`);
    await delay(10000);
    console.log(`Adding ${x} and ${y}...done`);
    return x + y;
  },
);

async function expensiveProgram(a: number, b: number) {
  const [x, y] = await Promise.all([
    expensiveSquare(a),
    expensiveSquare(b),
  ] as const);
  const result = await expensiveSum({ x, y });
  return result;
}

async function main() {
  console.log(await expensiveProgram(10, 20));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
