import { useState, useCallback } from "react";
import PropTypes from "prop-types";

const useForm = (initialValues, onSubmit) => {
  const [formData, setFormData] = useState(initialValues);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      onSubmit(formData, e);
    },
    [formData, onSubmit]
  );

  return { formData, handleChange, handleSubmit, setFormData };
};

useForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default useForm;
