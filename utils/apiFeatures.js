class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // /tours?duration[gt]=5&difficulty=easy
    // 1a) filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1b) Advanced filtering
    let queryStr = JSON.stringify(queryObj);

    // mongodb syntax: duration: { '$gt': '5' }
    // wir wollen aus gtd, gt, usw machen: $gtd, $gt --> $ hinzufügen!
    // regex:
    //   b: muss GENAU gte, gt, ... sein
    //   g: alle vorkommnisse ersetzen, nicht nur das erste
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // /tours?sort=-price,ratingsAverage
    if (this.queryString.sort) {
      // mongoose: sort('price ratingsAverave') --> replace string
      const sortBy = this.queryString.sort.replace(',', ' ');
      this.query = this.query.sort(sortBy);
    } else {
      // default sorting
      this.query = this.query.sort('-createdAt'); // -: DESC ordering
    }

    return this;
  }

  limitFields() {
    // /tours?fields=name,price
    if (this.queryString.fields) {
      const fields = this.queryString.fields.replace(/,/g, ' ');
      this.query = this.query.select(fields);
    } else {
      // Exclude __v fields by default
      this.query = this.query.select('-__v'); // Exclude fields: '-'
    }

    return this;
  }

  paginate() {
    // /tours?page=2&limit=10
    const page = parseInt(this.queryString.page || 1);
    const limit = parseInt(this.queryString.limit || 100);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
