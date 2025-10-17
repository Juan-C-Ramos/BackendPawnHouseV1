// controllers/payment.controller.js
const { Op } = require("sequelize");
const Payment = require("../models/Payment.js");
const PaymentUser = require("../models/PaymentsUsers.js");
const catchError = require('../utils/catchError');
const User = require("../models/User.js");
const Transaction = require("../models/Transaction.js");
const Customer = require("../models/Customer.js");

const HistorialSaldo = require('../models/HistorialSaldo');
const PaymentUsers = require("../models/PaymentsUsers.js");
const Role = require("../models/Role.js");

function getNextPaymentDate(fecha) {
  const d = new Date(fecha);
  if (isNaN(d)) return null;

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  const lastDay = new Date(year, month + 1, 0).getDate(); // último día del mes
  const scheduled15 = new Date(year, month, 15);
  const scheduledLast = new Date(year, month, lastDay);

  if (d.getTime() < scheduled15.getTime()) return scheduled15;
  if (d.getTime() < scheduledLast.getTime()) return scheduledLast;

  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear++;
  }
  return new Date(nextYear, nextMonth, 15);
}


/**
 * Obtener todos los pagos
 */

const getAll = async (req, res) => {
  try {
    const payments = await Payment.findAll();

    // Obtener todos los historiales a la vez (más eficiente que 1 por 1)
    const historiales = await HistorialSaldo.findAll();

    // Crear un mapa para acceso rápido por pagoId
    const historialMap = {};
    historiales.forEach(h => {
      historialMap[h.pagoId] = h; // si hay más de uno por pago, podrías agruparlos en un array
    });

    // Añadir el historial a cada pago
    const paymentsWithSaldo = payments.map(payment => {
      const historial = historialMap[payment.id];
      return {
        ...payment.toJSON(),
        saldoAnterior: historial ? historial.saldoAnterior : null,
        nuevoSaldo: historial ? historial.nuevoSaldo : null,
      };
    });

    return res.json(paymentsWithSaldo);
  } catch (error) {
    console.error("Error en getAll:", error);
    return res.status(500).json({ message: "Error al obtener los pagos" });
  }
};


const getAllPaymentUser = async (req, res) => {
  try {
    const paymentsUsers = await PaymentUser.findAll();
    return res.json(paymentsUsers);
  } catch (error) {
    console.error("Error en getAll:", error);
    return res.status(500).json({ message: "Error al obtener los pagos" });
  }
};

/**
 * Contar cantidad de pagos (ejemplo: para facturación)
 */
const getpaymentCount = async (req, res) => {
  try {
    const count = await Payment.count();
    return res.json({ count });
  } catch (error) {
    console.error("Error en getpaymentCount:", error);
    return res.status(500).json({ message: "Error al contar los pagos" });
  }
};

/**
 * Crear un pago
 */
// Crear pago y registrar usuario que lo realizó
// const create = catchError(async (req, res) => {
//   const { userId, ...paymentData } = req.body;

//   // Validación básica
//   if (!userId) {
//     return res.status(400).json({ message: "Se requiere el userId" });
//   }

//   // Crear pago
//   const newPayment = await Payment.create(paymentData);

//   // Registrar en PaymentUser
//   await PaymentUser.create({
//     userId,
//     paymentId: newPayment.id,
//   });

//   return res.status(201).json(newPayment);
// });






const create = catchError(async (req, res) => {
  const {
    userId,
    transactionId,
    amount,
    capital,
    interestAmount,
    layPaymentFee,
    itbms,
    paymentDate,
    paymentMethod,
    calcularIntereses,
    nuevaMora
  } = req.body;

  console.log(req.body);

  if (!userId || !transactionId || !amount) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  // 1️⃣ Buscar transacción
  const transaction = await Transaction.findByPk(transactionId);
  if (!transaction) {
    return res.status(404).json({ message: "Transacción no encontrada" });
  }

  // 2️⃣ Saldo anterior
  const saldoAnterior = transaction.capital + (transaction.morosidadAmount || 0);

  // 3️⃣ Crear pago
  const newPayment = await Payment.create({
    amount,
    capital,
    interestAmount,
    layPaymentFee,
    itbms,
    paymentDate,
    paymentMethod,
    transactionId,
  });

  // 4️⃣ Registrar el usuario creador
  await PaymentUsers.create({
    userId,
    paymentId: newPayment.id,
  });

  // 5️⃣ Calcular nuevos valores
  let nuevoCapital = Math.max(transaction.capital - capital, 0);
  let nuevaMorosidad = Math.max((transaction.morosidadAmount || 0) - layPaymentFee, 0);

  // Si hubo intereses pendientes, se acumulan como morosidad
  const interesesPendientes =
    (transaction.capital * (transaction.interestsPorcent / 100)) - interestAmount;

  if ((interesesPendientes > 0) && calcularIntereses) {
    nuevaMorosidad = parseFloat((nuevaMorosidad + interesesPendientes).toFixed(2));
  }

  const nuevoSaldo = nuevoCapital + nuevaMorosidad;
  const nextPaymentDate = getNextPaymentDate(paymentDate || new Date());

  // 6️⃣ Actualizar transacción
  if (nuevoCapital < 0.01 && nuevaMorosidad < 0.01) {
    await transaction.update({
      status: "paid",
      capital: 0,
      morosidadAmount: 0,
      nextPaymentDate,
    });
  } else {
    await transaction.update({
      capital: nuevoCapital,
      morosidadAmount: nuevaMora,
      nextPaymentDate,
    });
  }

  // 7️⃣ Guardar historial de saldos
  await HistorialSaldo.create({
    pagoId: newPayment.id,
    saldoAnterior,
    nuevoSaldo,
  });

  // 8️⃣ Traer datos del usuario creador (con Role)
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });

  // 9️⃣ Responder con todo lo necesario
  return res.status(201).json({
    ...newPayment.toJSON(),
    saldoAnterior,
    nuevoSaldo,
    creadoPor: user ? user.toJSON() : null,
  });
});




/**
 * Obtener un pago por ID
 */
const getOne = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: "Pago no encontrado" });
    return res.json(payment);
  } catch (error) {
    console.error("Error en getOne:", error);
    return res.status(500).json({ message: "Error al obtener el pago" });
  }
};

/**
 * Eliminar un pago por ID
 */
const remove = async (req, res) => {
  try {
    const deleted = await Payment.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Pago no encontrado" });
    return res.json({ message: "Pago eliminado" });
  } catch (error) {
    console.error("Error en remove:", error);
    return res.status(500).json({ message: "Error al eliminar el pago" });
  }
};

/**
 * Actualizar un pago por ID
 */
const update = async (req, res) => {
  try {
    const [updated] = await Payment.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ message: "Pago no encontrado" });
    return res.json({ message: "Pago actualizado" });
  } catch (error) {
    console.error("Error en update:", error);
    return res.status(500).json({ message: "Error al actualizar el pago" });
  }
};

/**
 * Eliminar todos los pagos de un mes/año según `paymentDate`
 */
const removeByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    const { year } = req.query; // opcional por query
    if (!month || !year) {
      return res.status(400).json({ message: "Mes y año son requeridos" });
    }

    const deleted = await Payment.destroy({
      where: {
        paymentDate: {
          [Op.between]: [
            new Date(`${year}-${month}-01`),
            new Date(`${year}-${month}-31`)
          ]
        }
      }
    });

    return res.json({ message: `Se eliminaron ${deleted} pagos del ${month}/${year}` });
  } catch (error) {
    console.error("Error en removeByMonth:", error);
    return res.status(500).json({ message: "Error al eliminar pagos del mes" });
  }
};

/**
 * Marcar todos los pagos como registrados (`isRegistered = true`)
 */
const setAllRegistered = async (req, res) => {
  try {
    const [updated] = await Payment.update(
      { isRegistered: true },
      { where: {} }
    );
    return res.json({ message: `${updated} pagos marcados como registrados` });
  } catch (error) {
    console.error("Error en setAllRegistered:", error);
    return res.status(500).json({ message: "Error al actualizar registros" });
  }
};

/**
 * Marcar solo pagos seleccionados como registrados
 * Espera body: { ids: [1,2,3] }
 */
const setRegisteredByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: "Debes enviar un array de IDs" });
    }

    const [updated] = await Payment.update(
      { isRegistered: true },
      { where: { id: ids } }
    );

    return res.json({ message: `${updated} pagos marcados como registrados` });
  } catch (error) {
    console.error("Error en setRegisteredByIds:", error);
    return res.status(500).json({ message: "Error al actualizar registros" });
  }
};

/**
 * Obtener pagos por ID de usuario (relación manual con PaymentUser)
 */
const getPaymentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar registros de la tabla intermedia
    const userPayments = await PaymentUser.findAll({
      where: { userId },
      attributes: ["paymentId"]
    });

    if (!userPayments.length) {
      return res.json([]);
    }

    // Extraer solo los IDs de pagos
    const paymentIds = userPayments.map(up => up.paymentId);

    // Buscar pagos asociados
    const payments = await Payment.findAll({
      where: { id: paymentIds }
    });

    return res.json(payments);
  } catch (error) {
    console.error("Error en getPaymentsByUser:", error);
    return res.status(500).json({ message: "Error al obtener pagos del usuario" });
  }
};

const getPaymentsByUserAndMonth = catchError(async (req, res) => {
  const { userId, month } = req.params;
  const { year } = req.query;

  const targetYear = year || new Date().getFullYear();

  // Rango de fechas basado en paymentDate
  const startDate = new Date(targetYear, month - 1, 1);
  const endDate = new Date(targetYear, month, 1);

  // 1️⃣ Buscar IDs de pagos para el usuario
  const paymentUserRecords = await PaymentUsers.findAll({
    where: { userId },
    attributes: ['paymentId']
  });

  const paymentIds = paymentUserRecords.map(pu => pu.paymentId);

  if (paymentIds.length === 0) {
    return res.json([]); // no tiene pagos ese usuario
  }

  // 2️⃣ Buscar los pagos que coinciden con ese rango
  const payments = await Payment.findAll({
    where: {
      id: paymentIds,
      paymentDate: {
        [Op.gte]: startDate,
        [Op.lt]: endDate
      }
    },
    include: [
      {
        model: Transaction,
        include: [ Customer ]
      }
    ],
    order: [['paymentDate', 'DESC']]
  });

  return res.json(payments);
});

/**
 * Obtener pagos de un usuario por rango de fechas
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
const getPaymentsByUserByDateRange = catchError(async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Debes enviar startDate y endDate en formato YYYY-MM-DD" });
  }

  // 1️⃣ Buscar IDs de pagos para el usuario
  const paymentUserRecords = await PaymentUsers.findAll({
    where: { userId },
    attributes: ['paymentId']
  });

  const paymentIds = paymentUserRecords.map(pu => pu.paymentId);

  if (paymentIds.length === 0) return res.json([]);

  // 2️⃣ Buscar pagos que estén en el rango de fechas
  const payments = await Payment.findAll({
    where: {
      id: paymentIds,
      paymentDate: {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      }
    },
    include: [
      {
        model: Transaction,
        include: [ Customer ]
      }
    ],
    order: [['paymentDate', 'DESC']]
  });

  return res.json(payments);
});

const getDailyClosure = catchError(async (req, res) => {
  const { userId } = req.params;
  const { date, splitItbms } = req.query;

  if (!userId || !date) {
    return res.status(400).json({ message: "Faltan parámetros userId o date" });
  }

  // Buscar el usuario para obtener su roleId
  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  let payments = [];

  if (user.roleId === 3) {
    // Role 3 -> Todos los pagos del día sin filtrar por usuario
    payments = await Payment.findAll({
      where: { paymentDate: date },
    });
  } else {
    // Otros roles -> Filtrar por usuario como antes
    const paymentUserRecords = await PaymentUser.findAll({
      where: { userId },
      attributes: ["paymentId"],
    });

    const paymentIds = paymentUserRecords.map((p) => p.paymentId);

    if (paymentIds.length === 0) {
      return res.json({
        totals: { capital: 0, itbms: 0, interestsMorosity: 0 },
        totalsByMethod: [],
      });
    }

    payments = await Payment.findAll({
      where: {
        id: paymentIds,
        paymentDate: date,
      },
    });
  }

  // --- Función reutilizable para calcular totales ---
  const calculateTotals = (list) => {
    // Totales generales
    const totals = list.reduce(
      (acc, p) => {
        acc.capital += p.capital || 0;
        acc.itbms += p.itbms || 0;
        acc.interestsMorosity += (p.interestAmount || 0) + (p.layPaymentFee || 0);
        return acc;
      },
      { capital: 0, itbms: 0, interestsMorosity: 0 }
    );

    // Totales por método
    const allowedMethods = ["efectivo", "aliado", "nacional", "bac", "caja", "mercantil"];
    const totalsByMethodMap = {};

    list.forEach((p) => {
      const method = allowedMethods.includes(p.paymentMethod) ? p.paymentMethod : "otro";
      if (!totalsByMethodMap[method]) totalsByMethodMap[method] = 0;
      totalsByMethodMap[method] +=
        (p.capital || 0) +
        (p.itbms || 0) +
        ((p.interestAmount || 0) + (p.layPaymentFee || 0));
    });

    const totalsByMethod = Object.entries(totalsByMethodMap).map(([method, total]) => ({
      method,
      total,
    }));

    return { totals, totalsByMethod };
  };

  // --- Caso normal (lo que ya tenías) ---
  if (!splitItbms || splitItbms === "false") {
    return res.json(calculateTotals(payments));
  }

  // --- Caso con separación ---
  const withItbms = payments.filter((p) => (p.itbms || 0) > 0);
  const withoutItbms = payments.filter((p) => (p.itbms || 0) === 0);

  return res.json({
    withITBMS: calculateTotals(withItbms),
    withoutITBMS: calculateTotals(withoutItbms),
  });
});




/**
 * Obtener pagos de una fecha específica (paymentDate)
 * Query param opcional: ?splitItbms=true/false
 */
const getPaymentsByDate = catchError(async (req, res) => {
  const { date } = req.params;
  const { splitItbms } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Debes enviar una fecha" });
  }

  // Ajustar fechas para incluir todo el día
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  // 1️⃣ Obtener pagos en esa fecha
  const payments = await Payment.findAll({
    where: {
      paymentDate: {
        [Op.gte]: start,
        [Op.lte]: end,
      },
    },
    include: [
      {
        model: Transaction,
        include: [Customer, Payment],
      },
    ],
    order: [["paymentDate", "DESC"]],
  });

  // 2️⃣ Obtener IDs de pagos para buscar historiales
  const paymentIds = payments.map(p => p.id);

  // 3️⃣ Obtener historiales asociados a esos pagos
  const historialSaldos = await HistorialSaldo.findAll({
    where: { pagoId: paymentIds },
    order: [['createdAt', 'ASC']]
  });

  // 4️⃣ Función para calcular totales
  const calculateTotals = (list) => {
    const totals = list.reduce(
      (acc, p) => {
        acc.capital += p.capital || 0;
        acc.itbms += p.itbms || 0;
        acc.interestsMorosity += (p.interestAmount || 0) + (p.layPaymentFee || 0);
        return acc;
      },
      { capital: 0, itbms: 0, interestsMorosity: 0 }
    );

    const allowedMethods = ["efectivo", "aliado", "nacional", "bac", "caja", "mercantil"];
    const totalsByMethodMap = {};

    list.forEach((p) => {
      const method = allowedMethods.includes(p.paymentMethod) ? p.paymentMethod : "otro";
      if (!totalsByMethodMap[method]) totalsByMethodMap[method] = 0;
      totalsByMethodMap[method] +=
        (p.capital || 0) + (p.itbms || 0) + ((p.interestAmount || 0) + (p.layPaymentFee || 0));
    });

    const totalsByMethod = Object.entries(totalsByMethodMap).map(([method, total]) => ({
      method,
      total,
    }));

    return { totals, totalsByMethod, payments: list };
  };

  // 5️⃣ Retornar respuesta
  if (!splitItbms || splitItbms === "false") {
    return res.json({ ...calculateTotals(payments), historialSaldos });
  }

  const withItbms = payments.filter((p) => (p.itbms || 0) > 0);
  const withoutItbms = payments.filter((p) => (p.itbms || 0) === 0);

  return res.json({
    payments,
    withITBMS: { 
      ...calculateTotals(withItbms), 
      historialSaldos: historialSaldos.filter(h => withItbms.map(p => p.id).includes(h.pagoId)) 
    },
    withoutITBMS: { 
      ...calculateTotals(withoutItbms), 
      historialSaldos: historialSaldos.filter(h => withoutItbms.map(p => p.id).includes(h.pagoId)) 
    },
  });
});


/**
 * Obtener pagos en un rango de fechas (paymentDate)
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&splitItbms=true/false
 */
// const getPaymentsByDateRange = catchError(async (req, res) => {
//   const { startDate, endDate, splitItbms } = req.query;

//   if (!startDate || !endDate) {
//     return res.status(400).json({ message: "Debes enviar startDate y endDate en formato YYYY-MM-DD" });
//   }

//   const payments = await Payment.findAll({
//     where: {
//       paymentDate: {
//         [Op.gte]: new Date(startDate),
//         [Op.lte]: new Date(endDate),
//       },
//     },
//     include: [
//       {
//         model: Transaction,
//         include: [Customer, Payment],
//       },
//     ],
//     order: [["paymentDate", "DESC"]],
//   });

//   const calculateTotals = (list) => {
//     const totals = list.reduce(
//       (acc, p) => {
//         acc.capital += p.capital || 0;
//         acc.itbms += p.itbms || 0;
//         acc.interestsMorosity += (p.interestAmount || 0) + (p.layPaymentFee || 0);
//         return acc;
//       },
//       { capital: 0, itbms: 0, interestsMorosity: 0 }
//     );

//     const allowedMethods = ["efectivo", "aliado", "nacional", "bac", "caja", "mercantil"];
//     const totalsByMethodMap = {};

//     list.forEach((p) => {
//       const method = allowedMethods.includes(p.paymentMethod) ? p.paymentMethod : "otro";
//       if (!totalsByMethodMap[method]) totalsByMethodMap[method] = 0;
//       totalsByMethodMap[method] +=
//         (p.capital || 0) + (p.itbms || 0) + ((p.interestAmount || 0) + (p.layPaymentFee || 0));
//     });

//     const totalsByMethod = Object.entries(totalsByMethodMap).map(([method, total]) => ({
//       method,
//       total,
//     }));

//     return { totals, totalsByMethod, payments };
//   };

//   if (!splitItbms || splitItbms === "false") {
//     return res.json(calculateTotals(payments));
//   }

//   const withItbms = payments.filter((p) => (p.itbms || 0) > 0);
//   const withoutItbms = payments.filter((p) => (p.itbms || 0) === 0);

//   return res.json({
//     withITBMS: calculateTotals(withItbms),
//     withoutITBMS: calculateTotals(withoutItbms), payments
//   });
// });

const getPaymentsByDateRange = catchError(async (req, res) => {
  const { startDate, endDate, splitItbms } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Debes enviar startDate y endDate en formato YYYY-MM-DD" });
  }

  // Ajustar fechas para incluir todo el día final
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // incluye todo el día final

  // 1️⃣ Obtener pagos en el rango de fechas
  const payments = await Payment.findAll({
    where: {
      paymentDate: {
        [Op.gte]: start,
        [Op.lte]: end,
      },
    },
    include: [
      {
        model: Transaction,
        include: [Customer, Payment],
      },
    ],
    order: [["paymentDate", "DESC"]],
  });

  // 2️⃣ Obtener IDs de pagos para buscar historiales
  const paymentIds = payments.map(p => p.id);

  // 3️⃣ Obtener historiales asociados a esos pagos
  const historialSaldos = await HistorialSaldo.findAll({
    where: { pagoId: paymentIds },
    order: [['createdAt', 'ASC']]
  });

  // 4️⃣ Función para calcular totales
  const calculateTotals = (list) => {
    const totals = list.reduce(
      (acc, p) => {
        acc.capital += p.capital || 0;
        acc.itbms += p.itbms || 0;
        acc.interestsMorosity += (p.interestAmount || 0) + (p.layPaymentFee || 0);
        return acc;
      },
      { capital: 0, itbms: 0, interestsMorosity: 0 }
    );

    const allowedMethods = ["efectivo", "aliado", "nacional", "bac", "caja", "mercantil"];
    const totalsByMethodMap = {};

    list.forEach((p) => {
      const method = allowedMethods.includes(p.paymentMethod) ? p.paymentMethod : "otro";
      if (!totalsByMethodMap[method]) totalsByMethodMap[method] = 0;
      totalsByMethodMap[method] +=
        (p.capital || 0) + (p.itbms || 0) + ((p.interestAmount || 0) + (p.layPaymentFee || 0));
    });

    const totalsByMethod = Object.entries(totalsByMethodMap).map(([method, total]) => ({
      method,
      total,
    }));

    return { totals, totalsByMethod, payments: list };
  };

  // 5️⃣ Retornar respuesta
  if (!splitItbms || splitItbms === "false") {
    return res.json({ ...calculateTotals(payments), historialSaldos });
  }

  const withItbms = payments.filter((p) => (p.itbms || 0) > 0);
  const withoutItbms = payments.filter((p) => (p.itbms || 0) === 0);

  return res.json({
    payments,
    withITBMS: { 
      ...calculateTotals(withItbms), 
      historialSaldos: historialSaldos.filter(h => withItbms.map(p => p.id).includes(h.pagoId)) 
    },
    withoutITBMS: { 
      ...calculateTotals(withoutItbms), 
      historialSaldos: historialSaldos.filter(h => withoutItbms.map(p => p.id).includes(h.pagoId)) 
    },
  });
});









module.exports = {
  getAll,
  getpaymentCount,
  create,
  getOne,
  remove,
  update,
  removeByMonth,
  setAllRegistered,
  setRegisteredByIds,
  getPaymentsByUser,
  getPaymentsByUserAndMonth,
  getPaymentsByUserByDateRange,
  getDailyClosure,
  getAllPaymentUser,
  getPaymentsByDate,
  getPaymentsByDateRange
};
