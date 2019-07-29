const categories = []

categories.categoryExists = function (categoryName) {
  let exists = false
  for (let i = 0; i < this.length; i++) {
    if (categoryName === this[i].category) {
      exists = true
      break
    }
  }
  return exists
}

console.log(categories.categoryExists('papo')) // false
categories.push({category: 'papo'})
categories.push({category: 'sandy'})
categories.push({category: 'amigos'})
console.log(categories.categoryExists('papo')) // true
console.log(categories.categoryExists('sandy')) // true
console.log(categories.categoryExists('proyecto 1')) // false
