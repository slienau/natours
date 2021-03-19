const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (doc === null) {
      next(new AppError('No document found with that ID', 404));
      return;
    }

    res.status(204).json({
      status: 'success',
      data: null, // just for testing
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return the modified document rather than the original
      runValidators: true,
    });

    if (doc === null) {
      next(new AppError('No document found with that ID', 404));
      return;
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res
      .status(201) // created
      .json({
        status: 'success',
        data: newDoc,
      });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (doc === null) {
      next(new AppError('No document found with that ID', 404));
      return;
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (small hack, could be done better)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const documents = await features.query;
    // const documents = await features.query.explain();

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: documents,
    });
  });
