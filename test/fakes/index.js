import faker from "faker";
import times from "lodash.times";
import random from "lodash.random";

/**
 * return array with size with element could be random values between start and end
 * @param {*} size
 * @param {*} start
 * @param {*} end
 */
function rangeUniqRandom(size, start, end) {
  var arr = [];
  while (arr.length < size) {
    var r = random(start, end);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr;
}

export function generateFakes(db) {
  return db.category
    .bulkCreate(
      times(5, () => ({
        name: faker.commerce.department()
      }))
    )
    .then(_ =>
      db.customer.bulkCreate(
        times(10, () => ({
          name: faker.lorem.sentence(),
          since: faker.date.past(),
          revenue: faker.commerce.price()
        }))
      )
    )
    .then(_ =>
      db.product.bulkCreate(
        times(50, () => ({
          description: faker.lorem.sentence(),
          price: faker.commerce.price(),
          categoryId: random(1, 5)
        }))
      )
    )
    .then(_ =>
      db.order.bulkCreate(
        times(20, () => ({
          description: faker.lorem.sentence(),
          customerId: random(1, 5)
        }))
      )
    )
    .then(_ =>
      db.order
        .findAll()
        .then(orders =>
          db.product
            .findAll()
            .then(products =>
              Promise.all(
                orders.map(order =>
                  rangeUniqRandom(random(1, 10), 0, 49).map(productIndx =>
                    order.addItem(products[productIndx])
                  )
                )
              )
            )
        )
    );
}
