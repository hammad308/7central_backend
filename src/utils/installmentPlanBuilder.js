// utils/installmentPlanBuilder.js
const dayjs = require("dayjs");

function addPeriod(d, durationStr) {
  const map = {
    'Monthly': { months: 1 },
    'Quarterly': { months: 3 },
    'Half Yearly': { months: 6 },
    'Monthly + Half Yearly': { months: 6 },
    'Yearly': { years: 1 }
  };
  const inc = map[durationStr];
  if (!inc) throw new Error(`Unknown duration ${durationStr}`);
  return dayjs(d).add(inc.months || 0, 'month').add(inc.years || 0, 'year').toDate();
}

function buildInstallmentRows({ plan, saleId, userId }) {
  const rows = [];
  const monthMap = new Map();

  const today = dayjs().startOf("day");

  const monthKey = (d) => dayjs(d).format("YYYY-MM");

  const push = (kind, dueDate, amount) => {
    if (!amount || amount <= 0 || !dueDate) return;

    let d = dayjs(dueDate).startOf("day");
    let safety = 0;

    while (safety++ < 2400) {
      const key = monthKey(d);

      if (!monthMap.has(key)) {
        monthMap.set(key, rows.length);
        rows.push({
          plan: plan._id,
          sale: saleId,
          inventory: plan.inventory,
          type: kind,
          dueDate: d.toDate(),
          amount,
          status: "un-paid",
          paidAmount: 0,
          paidAt: null,
          createdBy: userId || null,
        });
        return;
      }

      d = d.add(1, "month");
    }

    throw new Error("Could not schedule installment without overlap");
  };

  // 1) Milestones
  if (plan.fullPayment) {
    push("full_payment", today.toDate(), plan.fullPayment);
  }

  if (plan.downPayment) {
    push("down_payment", today.toDate(), plan.downPayment);
  }

  if (plan.allocation) {
    push("allocation", today.add(30, "day").toDate(), plan.allocation);
  }

  if (plan.confirmation) {
    push("confirmation", today.add(60, "day").toDate(), plan.confirmation);
  }

  // 2) Balloon stream
  if (plan.balloon?.count) {
    let d = plan.balloon.startDate || today.add(6, "month").toDate();
    for (let i = 0; i < plan.balloon.count; i++) {
      push("balloon", d, plan.balloon.amount);
      d = addPeriod(d, plan.balloon.duration);
    }
  }

  if (plan.monthlyBalloon?.count) {
    let d = plan.monthlyBalloon.startDate || today.add(6, "month").toDate();
    for (let i = 0; i < plan.monthlyBalloon.count; i++) {
      push("monthly_balloon", d, plan.monthlyBalloon.amount);
      d = addPeriod(d, plan.monthlyBalloon.duration);
    }
  }

  // 3) Quarterly
  if (plan.quarterly?.count) {
    let d = plan.quarterly.startDate || today.add(3, "month").toDate();
    for (let i = 0; i < plan.quarterly.count; i++) {
      push("quarterly", d, plan.quarterly.amount);
      d = addPeriod(d, plan.quarterly.duration);
    }
  }

  // 4) Monthly
  if (plan.monthly?.count) {
    let d = plan.monthly.startDate || today.add(1, "month").toDate();
    for (let i = 0; i < plan.monthly.count; i++) {
      push("monthly", d, plan.monthly.amount);
      d = addPeriod(d, plan.monthly.duration);
    }
  }

  // 5) Possession
  if (plan.possession && rows.length > 0) {
    const lastDate = rows.reduce(
      (max, r) => (r.dueDate > max ? r.dueDate : max),
      rows[0].dueDate
    );

    const possessionDate = dayjs(lastDate)
      .add(1, "month")
      .startOf("day")
      .toDate();

    rows.push({
      plan: plan._id,
      sale: saleId,
      inventory: plan.inventory,
      type: "possession",
      dueDate: possessionDate,
      amount: plan.possession,
      status: "un-paid",
      paidAmount: 0,
      paidAt: null,
      createdBy: userId || null,
    });
  }

  rows.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  let seq = 1;
  for (const row of rows) {
    row.seq = seq++;
  }

  return rows;
}

function applyPaidAmountFIFO(rows, totalPaid) {
  let remainingPaid = Number(totalPaid || 0);

  return rows.map((row) => {
    const cloned = { ...row };

    if (remainingPaid <= 0) {
      cloned.paidAmount = 0;
      cloned.status = "un-paid";
      cloned.paidAt = null;
      return cloned;
    }

    if (remainingPaid >= cloned.amount) {
      cloned.paidAmount = cloned.amount;
      cloned.status = "paid";
      remainingPaid -= cloned.amount;
      return cloned;
    }

    cloned.paidAmount = remainingPaid;
    cloned.status = "partially-paid"; // make sure this exists in your enum
    remainingPaid = 0;
    return cloned;
  });
}

module.exports = {
  buildInstallmentRows,
  applyPaidAmountFIFO,
};