const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) =>
        detail.message.replace(/["']/g, ""),
      );
      return res.status(400).json({
        success: false,
        message: errorMessages[0],
        errors: errorMessages,
      });
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;
