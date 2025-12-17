const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const recipes = await prisma.recipe.createMany({
    data: [
      {
        title: "Lemon Herb Couscous",
        sourceUrl: "https://example.com/lemon-herb-couscous",
        ingredientsText: [
          "1 cup couscous",
          "1 cup vegetable broth",
          "1 lemon, zested and juiced",
          "2 tbsp olive oil",
          "1/2 cup chopped parsley",
          "Salt and pepper to taste",
        ].join("\n"),
        instructionsText: [
          "Bring broth to a simmer and pour over couscous.",
          "Cover and let sit for 5 minutes, then fluff with a fork.",
          "Stir in lemon zest, lemon juice, olive oil, and parsley.",
          "Season with salt and pepper.",
        ].join("\n"),
      },
      {
        title: "Crispy Chili Chickpeas",
        sourceUrl: "https://example.com/crispy-chili-chickpeas",
        ingredientsText: [
          "1 can chickpeas, rinsed and dried",
          "1 tbsp olive oil",
          "1 tsp smoked paprika",
          "1/2 tsp chili flakes",
          "1/2 tsp garlic powder",
          "Salt to taste",
        ].join("\n"),
        instructionsText: [
          "Preheat oven to 400°F.",
          "Toss chickpeas with olive oil and spices.",
          "Spread on a baking sheet and roast for 25 minutes.",
          "Cool slightly for extra crunch.",
        ].join("\n"),
      },
      {
        title: "Berry Breakfast Parfait",
        sourceUrl: "https://example.com/berry-parfait",
        ingredientsText: [
          "1 cup Greek yogurt",
          "1/2 cup granola",
          "1/2 cup mixed berries",
          "1 tbsp honey",
        ].join("\n"),
        instructionsText: [
          "Layer yogurt, granola, and berries in a glass.",
          "Drizzle with honey.",
          "Serve immediately.",
        ].join("\n"),
      },
    ],
  });

  const savedRecipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (savedRecipes.length >= 2) {
    await prisma.meal.create({
      data: {
        title: "Easy Weeknight Set",
        recipes: {
          create: savedRecipes.slice(0, 2).map((recipe) => ({
            recipeId: recipe.id,
          })),
        },
      },
    });
  }

  return recipes;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
