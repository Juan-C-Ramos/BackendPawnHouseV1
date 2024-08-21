const Customer = require("./Customer")
const Inventory = require("./Inventory")
const User = require("./User")
const Transaction = require("./Transaction")
const Payment = require("./Payment")
const Category = require("./Category")
const Branch = require("./Branch")
const Role = require("./Role")

//Users -> Customerforce: true});
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







