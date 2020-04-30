import { expect } from 'chai';
import db from './models';
import { mapTypes } from '../src/types';

describe('Map Types', function () {
  describe('from model', function () {
    it('should map from models to graphql', function () {
      const expectedTypes = ['Int', 'String', 'DateTime', 'DateTime'];

      const types = Object.values(
        db.sequelize.models.category.rawAttributes
      ).map((att) => mapTypes(att.type.key));
      expect(types).to.eql(expectedTypes);
    });
  });
});
