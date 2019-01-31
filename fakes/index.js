import faker from "faker";
import times from "lodash.times";
import random from "lodash.random";

const country = require("../data/country.json");
const countryCallCode = require("../data/country-by-calling-code.json");
const countryCurrencyCode = require("../data/country-by-currency-code.json");

const imagesUrls = [
  faker.image.abstract(),
  faker.image.animals(),
  faker.image.business(),
  faker.image.cats(),
  faker.image.city(),
  faker.image.food(),
  faker.image.nightlife(),
  faker.image.fashion(),
  faker.image.people(),
  faker.image.nature(),
  faker.image.sports(),
  faker.image.technics(),
  faker.image.transport()
];
const getImage = () => {
  return imagesUrls[random(0, imagesUrls.length - 1)];
};

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
  // return;

  const p = db.country
    .count("*")
    .then(_ =>
      db.country.bulkCreate(
        country
          .filter(c => c.abbreviation)
          .map(country => ({
            callCode: countryCallCode.find(c => c.country === country.country)
              .calling_code,
            currencyCode: countryCurrencyCode.find(
              c => c.country === country.country
            ).currency_code,
            name: country.country,
            code: country.abbreviation,
            id: country.abbreviation
          }))
      )
    )
    .then(_ =>
      db.category.bulkCreate(
        rangeUniqRandom(10, 1, 10).map(randomPosition => ({
          name: faker.commerce.department(),
          description: faker.lorem.paragraph(),
          position: randomPosition,
          countryId: "PT"
        }))
      )
    )
    .then(_ =>
      db.category.bulkCreate(
        rangeUniqRandom(10, 11, 20).map(randomPosition => ({
          name: faker.commerce.department(),
          description: faker.lorem.paragraph(),
          position: randomPosition,
          countryId: "ID"
        }))
      )
    )
    .then(_ =>
      db.service.bulkCreate(
        times(50, () => ({
          name: faker.commerce.productName(),
          description: faker.commerce.productMaterial(),
          price: faker.commerce.price(),
          countryId: "PT",
          categoryId: random(1, 10)
        }))
      )
    )
    .then(_ =>
      db.service.bulkCreate(
        times(50, () => ({
          name: faker.commerce.productName(),
          description: faker.commerce.productMaterial(),
          price: faker.commerce.price(),
          countryId: "ID",
          categoryId: random(11, 20)
        }))
      )
    );
}
