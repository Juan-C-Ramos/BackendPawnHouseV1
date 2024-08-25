const Customer = require("./Customer.js")
const Inventory = require("./Inventory.js")
const User = require("./User.js")
const Transaction = require("./Transaction.js")
const Payment = require("./Payment.js")
const Category = require("./Category.js")
const Branch = require("./Branch.js")
const Role = require("./Role.js")

//Users -> Customer);
Customer.belongsTo(User) //categoriesId
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







