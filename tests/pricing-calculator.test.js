const assert = require("node:assert/strict");
const { computePricingTargets } = require("../assets/js/escalamargen-calculators.js");

module.exports = [
  {
    name: "calcula facturación, tarifa por hora y proyecto con un escenario viable",
    run() {
      const result = computePricingTargets({
        desiredNetIncome: 5000000,
        fixedCosts: 1500000,
        billableHours: 80,
        projectsPerMonth: 4,
        targetMarginPercent: 20,
        taxesAndFeesPercent: 8,
      });

      assert.equal(result.isViable, true);
      assert.equal(result.operatingBase, 6500000);
      assert.ok(Math.abs(result.targetBilling - 9027777.777777778) < 0.0001);
      assert.ok(Math.abs(result.hourlyRate - 112847.22222222223) < 0.0001);
      assert.ok(Math.abs(result.projectPrice - 2256944.4444444445) < 0.0001);
    },
  },
  {
    name: "marca el escenario como no viable cuando fees y margen consumen toda la venta",
    run() {
      const result = computePricingTargets({
        desiredNetIncome: 1000000,
        fixedCosts: 500000,
        billableHours: 40,
        projectsPerMonth: 2,
        targetMarginPercent: 70,
        taxesAndFeesPercent: 30,
      });

      assert.equal(result.isViable, false);
      assert.equal(Number.isFinite(result.targetBilling), false);
      assert.equal(Number.isFinite(result.hourlyRate), false);
    },
  },
];
