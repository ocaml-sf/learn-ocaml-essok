import {
    Request,
    Response,
    NextFunction,
    Router,
} from 'express';

const router = Router();

router.use('/', require('./users'));
router.use('/profiles', require('./profiles'));
router.use('/servers', require('./server'));
router.use('/uploads', require('./upload'));

router.use(function (err : any, _req : Request,
                     res : Response, next : NextFunction) {
  if(err.name === 'ValidationError'){
    const errors : { [key : string] : any} = err.errors;
    Object.keys(errors).forEach((key : string) => {
      errors[key] = errors[key].message;
    });
    return res.status(422).json({ errors })
  }
  return next(err);
});

module.exports = router;
