const {
  VentasCredito,
  ProductosVentaCredito,
  Transaction,
  Cuotes,
  Customer,
  User,
  Payment,
  DisbursementAccount,
  PaymentUsers
} = require('../models'); // ajusta la ruta según tu proyecto
const sequelize = require('../utils/connection');

// =====================
// CREAR
// =====================
const create = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      // ===== Datos de la Transaction =====
      customerId,
      userId,
      branchId,
      inventoryId,
      description,
      amonunt,
      interestsType = 'ventas',
      interestsPorcent,
      interestAmount,
      morosidadAmount = 0,
      nextPaymentDate,
      startDate,
      endDate,
      cuotes,
      cuotesAmount,
      balance,
      capital,
      status = 'inProgress',
      transactionType = 'venta',
      isRegistered = false,

      // ===== Datos de VentasCredito (cabecera) =====
      nombre,
      facturaNumero, // ← ahora viene del front (obligatorio)
      precioContadoTotal,
      financiamientoTotal,
      montoFinanciado,
      abonoInicial,
      saldoCapital,
      saldoFinanciamiento,
      estado = 'activo',
      observaciones,

      // ===== Array de productos =====
      productos = [],

      // ===== Array de cuotas =====
      cuotas = [],

      // ===== Datos de DisbursementAccount =====
      bankName
    } = req.body;

    // =====================================================
    // 1. Validaciones básicas
    // =====================================================
    if (!customerId || !userId || !startDate || amonunt === undefined) {
      await t.rollback();
      return res.status(400).json({
        message: 'Faltan campos obligatorios de la transacción (customerId, userId, startDate, amonunt)'
      });
    }

    if (!nombre) {
      await t.rollback();
      return res.status(400).json({
        message: 'Falta el campo obligatorio de la venta a crédito (nombre)'
      });
    }

    if (!facturaNumero || !String(facturaNumero).trim()) {
      await t.rollback();
      return res.status(400).json({
        message: 'El campo facturaNumero es obligatorio'
      });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      await t.rollback();
      return res.status(400).json({
        message: 'Debes enviar al menos un producto en el array "productos"'
      });
    }

    for (const [index, producto] of productos.entries()) {
      if (
        !producto.marca ||
        !producto.modelo ||
        !producto.serie ||
        !producto.estado ||
        producto.precioContado === undefined
      ) {
        await t.rollback();
        return res.status(400).json({
          message: `Producto #${index + 1}: faltan campos obligatorios (marca, modelo, serie, estado, precioContado)`
        });
      }
    }

    if (!Array.isArray(cuotas) || cuotas.length === 0) {
      await t.rollback();
      return res.status(400).json({
        message: 'Debes enviar al menos una cuota en el array "cuotas"'
      });
    }

    if (!bankName) {
      await t.rollback();
      return res.status(400).json({
        message: 'El campo bankName es obligatorio para la cuenta de desembolso'
      });
    }

    // =====================================================
    // 2. Crear la Transaction
    // =====================================================
    const nuevaTransaction = await Transaction.create(
      {
        customerId,
        userId,
        branchId: branchId || null,
        inventoryId: inventoryId || null,
        contractNumber: null,
        description: description || null,
        amonunt,
        interestsType,
        interestsPorcent: interestsPorcent || null,
        interestAmount: interestAmount || null,
        morosidadAmount,
        nextPaymentDate: nextPaymentDate || null,
        startDate,
        endDate: endDate || null,
        cuotes: cuotes || cuotas.length,
        cuotesAmount: cuotesAmount || null,
        balance: balance || null,
        capital: capital || null,
        status,
        transactionType,
        isRegistered
      },
      { transaction: t }
    );

    // =====================================================
    // 3. contractNumber de la Transaction (id de Transaction)
    // =====================================================
    const year = new Date().getFullYear();
    const transactionContractNumber = `${year}-${String(nuevaTransaction.id).padStart(6, '0')}`;

    await nuevaTransaction.update(
      { contractNumber: transactionContractNumber },
      { transaction: t }
    );

    // =====================================================
    // 4. Crear VentasCredito
    //    facturaNumero = del body
    //    ventaCreditoNumero = se genera abajo con el id
    // =====================================================
    const nuevaVenta = await VentasCredito.create(
      {
        transactionId: nuevaTransaction.id,
        nombre,
        facturaNumero: String(facturaNumero).trim(),
        ventaCreditoNumero: 'TEMP', // temporal
        precioContadoTotal,
        financiamientoTotal,
        montoFinanciado,
        abonoInicial,
        saldoCapital,
        saldoFinanciamiento,
        estado,
        observaciones: observaciones || null
      },
      { transaction: t }
    );

    // =====================================================
    // 5. Generar ventaCreditoNumero (antes era facturaNumero)
    //    Formato: 2026-000045
    // =====================================================
    const ventaCreditoNumero = `${year}-${String(nuevaVenta.id).padStart(6, '0')}`;

    await nuevaVenta.update(
      { ventaCreditoNumero },
      { transaction: t }
    );

    // =====================================================
    // 6. Productos
    // =====================================================
    const productosParaCrear = productos.map((producto) => ({
      ventasCreditoId: nuevaVenta.id,
      marca: producto.marca,
      modelo: producto.modelo,
      serie: producto.serie,
      otros: producto.otros || null,
      estado: producto.estado,
      precioContado: producto.precioContado,
      financiamiento: producto.financiamiento || 0,
      montoFinanciado: producto.montoFinanciado
    }));

    await ProductosVentaCredito.bulkCreate(productosParaCrear, {
      transaction: t
    });

    // =====================================================
    // 7. Cuotas
    // =====================================================
    const cuotasParaCrear = cuotas.map((cuota, index) => ({
      cuoteNumber: cuota.cuoteNumber || String(index + 1),
      amount: cuota.amount,
      capitalAmount: cuota.capitalAmount,
      totalPaid: cuota.totalPaid || 0,
      amountInterest: cuota.amountInterest,
      paymentCutDate: cuota.paymentCutDate || null,
      latePaymentAmount: cuota.latePaymentAmount || 0,
      itbms: cuota.itbms || 0,
      idOfTransaction: nuevaTransaction.id,
      status: cuota.status || 'notPaid',
      transactionId: nuevaTransaction.id
    }));

    await Cuotes.bulkCreate(cuotasParaCrear, { transaction: t });

    // =====================================================
    // 8. DisbursementAccount
    // =====================================================
    await DisbursementAccount.create(
      {
        transactionId: nuevaTransaction.id,
        bankName
      },
      { transaction: t }
    );

    // =====================================================
    // 9. Commit
    // =====================================================
    await t.commit();

    // =====================================================
    // 10. Resultado completo
    // =====================================================
    const resultado = await VentasCredito.findByPk(nuevaVenta.id, {
      include: [
        {
          model: ProductosVentaCredito,
          as: 'productos'
        },
        {
          model: Transaction,
          as: 'transaction',
          include: [
            { model: Customer },
            {
              model: User,
              attributes: { exclude: ['email', 'password'] }
            },
            { model: Payment },
            {
              model: Cuotes,
              as: 'transactionCuotes'
            },
            { model: DisbursementAccount }
          ]
        }
      ]
    });

    return res.status(201).json({
      message:
        'Transacción, venta a crédito, productos, cuotas y cuenta de desembolso creadas correctamente',
      data: resultado
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear venta a crédito completa:', error);
    return res.status(500).json({
      message: 'Error interno al crear la venta a crédito',
      error: error.message
    });
  }
};

// =====================
// OBTENER TODAS
// =====================
const getAll = async (req, res) => {
  try {
    const ventas = await VentasCredito.findAll({
      include: [
        {
          model: ProductosVentaCredito,
          as: 'productos'
        },
        {
          model: Transaction,
          as: 'transaction',
          include: [
            { model: Customer },
            {
              model: User,
              attributes: { exclude: ['email', 'password'] }
            },
            { model: Payment },
            {
              model: Cuotes,
              as: 'transactionCuotes'
            },
            { model: DisbursementAccount }
          ]
        }
      ],
      order: [['id', 'DESC']]
    });

    return res.status(200).json({
      message: 'Ventas a crédito obtenidas correctamente',
      data: ventas
    });
  } catch (error) {
    console.error('Error al obtener ventas a crédito:', error);
    return res.status(500).json({
      message: 'Error interno al obtener las ventas a crédito',
      error: error.message
    });
  }
};

// =====================
// OBTENER POR ID
// =====================
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await VentasCredito.findByPk(id, {
      include: [
        {
          model: ProductosVentaCredito,
          as: 'productos'
        },
        {
          model: Transaction,
          as: 'transaction',
          include: [
            { model: Customer },
            {
              model: User,
              attributes: { exclude: ['email', 'password'] }
            },
            { model: Payment },
            {
              model: Cuotes,
              as: 'transactionCuotes'
            },
            { model: DisbursementAccount }
          ]
        }
      ]
    });

    if (!venta) {
      return res.status(404).json({
        message: 'Venta a crédito no encontrada'
      });
    }

    return res.status(200).json({
      message: 'Venta a crédito obtenida correctamente',
      data: venta
    });
  } catch (error) {
    console.error('Error al obtener venta a crédito:', error);
    return res.status(500).json({
      message: 'Error interno al obtener la venta a crédito',
      error: error.message
    });
  }
};

// =====================
// OBTENER POR transactionId
// =====================
const getByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const venta = await VentasCredito.findOne({
      where: { transactionId },
      include: [
        {
          model: ProductosVentaCredito,
          as: 'productos'
        },
        {
          model: Transaction,
          as: 'transaction',
          include: [
            { model: Customer },
            {
              model: User,
              attributes: { exclude: ['email', 'password'] }
            },
            { model: Payment },
            {
              model: Cuotes,
              as: 'transactionCuotes'
            },
            { model: DisbursementAccount }
          ]
        }
      ]
    });

    if (!venta) {
      return res.status(404).json({
        message: 'No se encontró venta a crédito para esta transacción'
      });
    }

    return res.status(200).json({
      message: 'Venta a crédito obtenida correctamente',
      data: venta
    });
  } catch (error) {
    console.error('Error al obtener venta por transactionId:', error);
    return res.status(500).json({
      message: 'Error interno al obtener la venta a crédito',
      error: error.message
    });
  }
};

// =====================
// ACTUALIZAR
// =====================
const update = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      nombre,
      facturaNumero,
      precioContadoTotal,
      financiamientoTotal,
      montoFinanciado,
      abonoInicial,
      saldoCapital,
      saldoFinanciamiento,
      estado,
      observaciones,
      productos // opcional: si se envía, se reemplazan los productos
    } = req.body;

    const venta = await VentasCredito.findByPk(id);

    if (!venta) {
      await t.rollback();
      return res.status(404).json({
        message: 'Venta a crédito no encontrada'
      });
    }

    // Actualizar cabecera
    await venta.update({
      nombre: nombre ?? venta.nombre,
      facturaNumero: facturaNumero ?? venta.facturaNumero,
      precioContadoTotal: precioContadoTotal ?? venta.precioContadoTotal,
      financiamientoTotal: financiamientoTotal ?? venta.financiamientoTotal,
      montoFinanciado: montoFinanciado ?? venta.montoFinanciado,
      abonoInicial: abonoInicial ?? venta.abonoInicial,
      saldoCapital: saldoCapital ?? venta.saldoCapital,
      saldoFinanciamiento: saldoFinanciamiento ?? venta.saldoFinanciamiento,
      estado: estado ?? venta.estado,
      observaciones: observaciones !== undefined ? observaciones : venta.observaciones
    }, { transaction: t });

    // Si envían productos, reemplazarlos
    if (Array.isArray(productos)) {
      // Eliminar productos anteriores
      await ProductosVentaCredito.destroy({
        where: { ventasCreditoId: id },
        transaction: t
      });

      // Crear los nuevos
      if (productos.length > 0) {
        const productosParaCrear = productos.map((producto) => ({
          ventasCreditoId: id,
          marca: producto.marca,
          modelo: producto.modelo,
          serie: producto.serie,
          otros: producto.otros || null,
          estado: producto.estado,
          precioContado: producto.precioContado,
          financiamiento: producto.financiamiento || 0,
          montoFinanciado: producto.montoFinanciado
        }));

        await ProductosVentaCredito.bulkCreate(productosParaCrear, { transaction: t });
      }
    }

    await t.commit();

    // Traer la venta actualizada
    const ventaActualizada = await VentasCredito.findByPk(id, {
      include: [
        {
          model: ProductosVentaCredito,
          as: 'productos'
        },
        {
          model: Transaction,
          as: 'transaction',
          include: [
            { model: Customer },
            {
              model: User,
              attributes: { exclude: ['email', 'password'] }
            },
            { model: Payment },
            {
              model: Cuotes,
              as: 'transactionCuotes'
            },
            { model: DisbursementAccount }
          ]
        }
      ]
    });

    return res.status(200).json({
      message: 'Venta a crédito actualizada correctamente',
      data: ventaActualizada
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar venta a crédito:', error);
    return res.status(500).json({
      message: 'Error interno al actualizar la venta a crédito',
      error: error.message
    });
  }
};

// =====================
// ELIMINAR
// =====================
const remove = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    const venta = await VentasCredito.findByPk(id);

    if (!venta) {
      await t.rollback();
      return res.status(404).json({
        message: 'Venta a crédito no encontrada'
      });
    }

    // Eliminar productos primero
    await ProductosVentaCredito.destroy({
      where: { ventasCreditoId: id },
      transaction: t
    });

    // Eliminar la venta
    await venta.destroy({ transaction: t });

    await t.commit();

    return res.status(200).json({
      message: 'Venta a crédito y sus productos eliminados correctamente'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar venta a crédito:', error);
    return res.status(500).json({
      message: 'Error interno al eliminar la venta a crédito',
      error: error.message
    });
  }
};

const { Op } = require("sequelize");

// =====================
// BUSCAR (nombre, cédula, factura, N° venta)
// GET /ventas-credito/search?q=texto
// =====================
const search = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q || q.length < 2) {
      return res.status(400).json({
        message: "La búsqueda debe tener al menos 2 caracteres",
      });
    }

    const like = `%${q}%`;

    const ventas = await VentasCredito.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.iLike]: like } },           // PostgreSQL
          // { nombre: { [Op.like]: like } },         // MySQL (descomenta y comenta iLike)
          { facturaNumero: { [Op.iLike]: like } },
          { ventaCreditoNumero: { [Op.iLike]: like } },
          { "$transaction.customer.firstName$": { [Op.iLike]: like } },
          { "$transaction.customer.lastName$": { [Op.iLike]: like } },
          { "$transaction.customer.numberID$": { [Op.iLike]: like } },
          { "$transaction.contractNumber$": { [Op.iLike]: like } },
        ],
      },
      include: [
        {
          model: Transaction,
          as: "transaction",
          required: true,
          include: [
            {
              model: Customer,
              required: false,
              attributes: ["id", "firstName", "lastName", "numberID", "phone"],
            },
          ],
        },
      ],
      order: [["id", "DESC"]],
      limit: 30,
    });

    // Respuesta liviana para el listado del buscador
    const mapped = ventas.map((v) => {
      const tx = v.transaction || {};
      const customer = tx.customer || null;

      return {
        id: v.id, // id de VentasCredito (para getById)
        transactionId: tx.id, // id de Transaction (para pagos)
        nombre:
          v.nombre ||
          (customer
            ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
            : "Sin nombre"),
        facturaNumero: v.facturaNumero,
        ventaCreditoNumero: v.ventaCreditoNumero,
        estado: v.estado,
        status: tx.status,
        balance: tx.balance,
        customer: customer
          ? {
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              numberID: customer.numberID,
              phone: customer.phone,
            }
          : null,
      };
    });

    return res.status(200).json(mapped);
  } catch (error) {
    console.error("Error en search ventas-credito:", error);
    return res.status(500).json({
      message: "Error interno al buscar ventas a crédito",
      error: error.message,
    });
  }
};


// =====================
// REPORTES por rango de fechas
// GET /ventas-credito/reportes?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Filtra por transaction.startDate
// =====================
const reportes = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Debes enviar startDate y endDate (YYYY-MM-DD)",
      });
    }

    const ventas = await VentasCredito.findAll({
      include: [
        {
          model: ProductosVentaCredito,
          as: "productos",
        },
        {
          model: Transaction,
          as: "transaction",
          required: true,
          where: {
            startDate: {
              [Op.between]: [startDate, endDate],
            },
          },
          include: [
            {
              model: Customer,
              attributes: [
                "id",
                "firstName",
                "lastName",
                "numberID",
                "phone",
              ],
            },
            {
              model: User,
              attributes: { exclude: ["email", "password"] },
            },
            {
              model: Cuotes,
              as: "transactionCuotes",
            },
            { model: DisbursementAccount },
          ],
        },
      ],
      order: [[{ model: Transaction, as: "transaction" }, "startDate", "ASC"]],
    });

    return res.status(200).json({
      message: "Informe obtenido correctamente",
      data: ventas,
    });
  } catch (error) {
    console.error("Error en reportes ventas-credito:", error);
    return res.status(500).json({
      message: "Error interno al generar el informe",
      error: error.message,
    });
  }
};

// =====================
// REPORTES — PAGOS
// GET /ventas-credito/reportes/pagos?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// =====================
const reportesPagos = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "startDate y endDate son requeridos (YYYY-MM-DD)",
      });
    }

    const inicio = new Date(`${startDate}T00:00:00.000`);
    const fin = new Date(`${endDate}T23:59:59.999`);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({
        message: "Fechas inválidas. Usa formato YYYY-MM-DD",
      });
    }

    if (inicio > fin) {
      return res.status(400).json({
        message: "startDate no puede ser mayor que endDate",
      });
    }

    // 1) Pagos en el rango (solo transacciones tipo venta)
    const pagos = await Payment.findAll({
      where: {
        paymentDate: {
          [Op.between]: [inicio, fin],
        },
      },
      include: [
        {
          model: Transaction,
          as: "transaction", // ajusta alias si es distinto
          required: true,
          where: {
            transactionType: "venta",
          },
          include: [
            {
              model: Customer,
              as: "customer", // ajusta alias si es distinto
              required: false,
              attributes: [
                "id",
                "firstName",
                "lastName",
                "numberID",
                "phone",
                "email",
              ],
            },
            {
              model: VentasCredito,
              as: "ventaCredito", // ajusta alias si es distinto
              required: false,
              attributes: [
                "id",
                "facturaNumero",
                "ventaCreditoNumero",
                "nombre",
                "estado",
                "montoFinanciado",
                "abonoInicial",
                "saldoCapital",
              ],
            },
          ],
        },
      ],
      order: [
        ["paymentDate", "ASC"],
        ["id", "ASC"],
      ],
    });

    const paymentIds = pagos.map((p) => p.id).filter(Boolean);

    // 2) Usuarios vía tabla intermedia paymentUsers (sin asociación Sequelize)
    let usersByPaymentId = {};

    if (paymentIds.length > 0) {
      const links = await PaymentUsers.findAll({
        where: {
          paymentId: { [Op.in]: paymentIds },
        },
        attributes: ["paymentId", "userId"],
        raw: true,
      });

      const userIds = [...new Set(links.map((l) => l.userId).filter(Boolean))];

      let usersMap = {};
      if (userIds.length > 0) {
        const users = await User.findAll({
          where: { id: { [Op.in]: userIds } },
          attributes: ["id", "firstName", "lastName"],
        });
        users.forEach((u) => {
          const plain = u.toJSON ? u.toJSON() : u;
          usersMap[plain.id] = plain;
        });
      }

      // Un pago podría tener más de un user en paymentUsers;
      // tomamos el primero (o puedes devolver un array)
      links.forEach((l) => {
        if (!usersByPaymentId[l.paymentId] && usersMap[l.userId]) {
          usersByPaymentId[l.paymentId] = usersMap[l.userId];
        }
      });
    }

    // 3) Normalizar respuesta para el front
    const data = pagos.map((p) => {
      const plain = p.toJSON ? p.toJSON() : p;
      const tx = plain.transaction || {};
      const customer = tx.customer || plain.customer || {};
      const venta =
        tx.ventaCredito ||
        tx.ventasCredito ||
        plain.ventaCredito ||
        plain.ventasCredito ||
        {};

      const user = usersByPaymentId[plain.id] || null;

      return {
        id: plain.id,
        paymentDate: plain.paymentDate,
        paymentMethod: plain.paymentMethod,
        amount: Number(plain.amount) || 0,
        capital: Number(plain.capital) || 0,
        interestAmount: Number(plain.interestAmount) || 0,
        layPaymentFee: Number(plain.layPaymentFee) || 0,
        itbms: Number(plain.itbms) || 0,
        transactionId: plain.transactionId || tx.id,
        userId: user?.id || null,
        customer,
        clienteNombre:
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          venta.nombre ||
          null,
        facturaNumero: venta.facturaNumero || null,
        ventaCreditoNumero: venta.ventaCreditoNumero || null,
        transaction: {
          id: tx.id,
          contractNumber: tx.contractNumber,
          status: tx.status,
          balance: tx.balance,
          customer,
        },
        ventaCredito: venta,
        user,
      };
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error en reportesPagos:", error);
    return res.status(500).json({
      message: "Error interno al obtener el informe de pagos",
      error: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  getByTransactionId,
  update,
  remove,
  search,
  reportes,
  reportesPagos
};                                                                                                                                                           