const Customer = require("./Customer.js")
const Inventory = require("./Inventory.js")
const User = require("./User.js")
const Transaction = require("./Transaction.js")
const Payment = require("./Payment.js")
const Category = require("./Category.js")
const Branch = require("./Branch.js")
const Role = require("./Role.js")
const ImageInventory = require("./ImageInventory.js")
const ProfilePhoto = require("./ProfilPhoto.js")
const Contract = require("./Contract.js")
const ProofOfServices = require("./ProofOfServices.js")
const InventoryBill = require("./InventoryBill.js")
const IdPhoto = require("./IDPhoto.js")
const Cuotes = require("./Cuote.js")
const LoginRegister = require("./LoginRegister.js")

// Importaciones de Empeños
// Módulo de Empeños
const ContratoEmpeno = require('./ModuloEmpeños/ContratoEmpeño')
const PrendaEmpeno = require('./ModuloEmpeños/PrendaEmpeño')
const Pagos = require('./ModuloEmpeños/Pagos')
const Venta = require("./ModuloEmpeños/Venta.js")
const HistorialSaldo = require("./HistorialSaldo.js")
const DisbursementAccount = require("./DisbursementAccount.js")


//Users -> Customer);
Customer.belongsTo(User)
User.hasMany(Customer)

//User -> Roles
User.belongsTo(Role) //branchesId
Role.hasMany(User) //branchesId

////////////////////////////////////////////////

//Transaction -> Customer
Transaction.belongsTo(Customer) //customerId
Customer.hasMany(Transaction)

//Transactios -> Branches
Transaction.belongsTo(Branch) //branchesId
Branch.hasMany(Transaction) //branchesId

//Transaction -> User
Transaction.belongsTo(User) //usersId
User.hasMany(Transaction)

//Transaction -> Inventory
Transaction.belongsTo(Inventory) //inventoryId
Inventory.hasMany(Transaction)

/////TransactionImg//////

//Transaction -> Contract
Transaction.hasMany(Contract)
Contract.belongsTo(Transaction) //contractId


//Transaction -> Coute
// En la definición de tu modelo transaction
Cuotes.belongsTo(Transaction, {
    as: 'transaction' // Cambia 'transaction' a cualquier otro nombre único si es necesario
  });
  
  Transaction.hasMany(Cuotes, {
    as: 'transactionCuotes', // Cambia 'cuotes' a 'transactionCuotes' o cualquier otro nombre único
    foreignKey: 'transactionId'
  });


  //Payments - cuotes
  Cuotes.belongsTo(Payment) 
  Payment.hasMany(Cuotes) 


////////////////////////////////////////////////

//Inventories -> Branches
Inventory.belongsTo(Branch) //branchesId
Branch.hasMany(Inventory) //branchesId

//Inventory -> Category
Inventory.belongsTo(Category) //categoriesId
Category.hasMany(Inventory)

///////////////////////////////////////////////

//Payments -> transactions
Payment.belongsTo(Transaction) //transactionsId
Transaction.hasMany(Payment) //transactionsIds

/////////////////////////////////////////////////////////
//loginRegister -> User
LoginRegister.belongsTo(User) //transactionsId
User.hasMany(LoginRegister) //transactionsIds

/////////////////////////////////////////////
//InventoryImages
Inventory.belongsTo(ImageInventory)
ImageInventory.hasMany(Inventory)

Inventory.belongsTo(InventoryBill)
InventoryBill.hasMany(Inventory)

//ProfilePhotos
User.belongsTo(ProfilePhoto)
ProfilePhoto.hasOne(ProfilePhoto)

//////////////////////////////////////////////

//Customer -> PhotoID
IdPhoto.belongsTo(Customer)
Customer.hasOne(IdPhoto)

//Customer -> ProofOfServices
ProofOfServices.belongsTo(Customer) //proofOfServicesId
Customer.hasOne(ProofOfServices)


/////////////////////////////////////////////
// MODULO DE EMPEÑOS
/////////////////////////////////////////////

// Customer -> ContratoEmpeño
Customer.hasMany(ContratoEmpeno, {
  foreignKey: 'customerId'
})
ContratoEmpeno.belongsTo(Customer, {
  foreignKey: 'customerId'
})

// User -> ContratoEmpeño
User.hasMany(ContratoEmpeno, {
  foreignKey: 'userId'
})
ContratoEmpeno.belongsTo(User, {
  foreignKey: 'userId'
})

// ContratoEmpeño -> PrendaEmpeño
ContratoEmpeno.hasMany(PrendaEmpeno, {
  foreignKey: 'contratoEmpenoId'
})
PrendaEmpeno.belongsTo(ContratoEmpeno, {
  foreignKey: 'contratoEmpenoId'
})

// ContratoEmpeño -> PagosEmpeno
ContratoEmpeno.hasMany(Pagos, {
  foreignKey: 'contratoEmpenoId'
})
Pagos.belongsTo(ContratoEmpeno, {
  foreignKey: 'contratoEmpenoId'
})

// User -> PagosEmpeno
User.hasMany(Pagos, {
  foreignKey: 'userId'
})
Pagos.belongsTo(User, {
  foreignKey: 'userId'
})

// Ventas -> ContratoEmpeño

Venta.belongsTo(ContratoEmpeno, {
  foreignKey: "contratoEmpenoId"
});

ContratoEmpeno.hasOne(Venta, {
  foreignKey: "contratoEmpenoId"
});

Venta.belongsTo(PrendaEmpeno, {
  foreignKey: "prendaEmpenoId"
});

PrendaEmpeno.hasMany(Venta, {
  foreignKey: "prendaEmpenoId"
});


//historial de pago
Payment.hasOne(HistorialSaldo, {
  foreignKey: "pagoId",
});

HistorialSaldo.belongsTo(Payment, {
  foreignKey: "pagoId",
});

// cuentas de desembolso Presatamos
Transaction.hasOne(DisbursementAccount, {
  foreignKey: "transactionId",
});

DisbursementAccount.belongsTo(Transaction, {
  foreignKey: "transactionId",
});


module.exports = {
  // modelos existentes
  Customer,
  Inventory,
  User,
  Transaction,
  Payment,
  Category,
  Branch,
  Role,
  ImageInventory,
  ProfilePhoto,
  Contract,
  ProofOfServices,
  InventoryBill,
  IdPhoto,
  Cuotes,
  LoginRegister,
  HistorialSaldo,
  DisbursementAccount,

  // 🔥 módulo de empeños
  ContratoEmpeno,
  PrendaEmpeno,
  Pagos,
  Venta,
}
