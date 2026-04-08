(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.EscalaMargenCalculators = Object.assign(root.EscalaMargenCalculators || {}, api);
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function computePricingTargets(input = {}) {
    const desiredNetIncome = Math.max(toNumber(input.desiredNetIncome), 0);
    const fixedCosts = Math.max(toNumber(input.fixedCosts), 0);
    const billableHours = Math.max(toNumber(input.billableHours), 0);
    const projectsPerMonth = Math.max(toNumber(input.projectsPerMonth), 1);
    const targetMarginPercent = Math.max(toNumber(input.targetMarginPercent), 0);
    const taxesAndFeesPercent = Math.max(toNumber(input.taxesAndFeesPercent), 0);

    const targetMarginRate = targetMarginPercent / 100;
    const feesRate = taxesAndFeesPercent / 100;
    const denominator = 1 - feesRate - targetMarginRate;
    const operatingBase = desiredNetIncome + fixedCosts;
    const baseWithoutBuffer = feesRate < 1
      ? operatingBase / Math.max(1 - feesRate, 0.000001)
      : Number.NaN;
    const targetBilling = denominator > 0
      ? operatingBase / denominator
      : Number.NaN;
    const hourlyRate = billableHours > 0 && Number.isFinite(targetBilling)
      ? targetBilling / billableHours
      : Number.NaN;
    const projectPrice = Number.isFinite(targetBilling)
      ? targetBilling / projectsPerMonth
      : Number.NaN;
    const feesAmount = Number.isFinite(targetBilling)
      ? targetBilling * feesRate
      : Number.NaN;
    const marginBuffer = Number.isFinite(targetBilling)
      ? targetBilling * targetMarginRate
      : Number.NaN;

    return {
      desiredNetIncome,
      fixedCosts,
      billableHours,
      projectsPerMonth,
      targetMarginPercent,
      taxesAndFeesPercent,
      targetMarginRate,
      feesRate,
      operatingBase,
      baseWithoutBuffer,
      targetBilling,
      hourlyRate,
      projectPrice,
      feesAmount,
      marginBuffer,
      isViable: Number.isFinite(targetBilling) && targetBilling > 0,
    };
  }

  return {
    computePricingTargets,
  };
});
