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



