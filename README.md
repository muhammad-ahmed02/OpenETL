# OpenETL

Welcome to OpenETL, a free and user-friendly ETL (Extract, Transform, Load) application built on Streamlit! This powerful tool enables you to perform basic ETL processes with full load capabilities. With OpenETL, you can effortlessly extract data from various sources, apply transformations, and load it into your desired target location.

## Features

- **ETL with Full Load**: Easily extract data from different sources and load it into your preferred target location.

## Getting Started

To get started with OpenETL, follow these simple steps:

### Using Docker

1. Ensure that you have Docker installed on your local machine.
2. Clone this repository to your local environment.
3. Open a terminal or command prompt and navigate to the project directory.
4. Build the Docker image by running the following command:
    ```sh
    docker build -t openetl .
    ```
5. Launch the Docker container:
    ```sh
    docker run -d -p 8500:8501 openetl
    ```
6. Open your web browser and visit `http://localhost:8500` to access the OpenETL application.

### Using Python

1. Ensure you have Python 3.8+ installed on your local machine.
2. Clone this repository to your local environment.
3. Open a terminal or command prompt and navigate to the project directory.
4. Create and activate a virtual environment:
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
5. Install the required dependencies:
    ```sh
    pip install -r requirements.txt
    ```
6. Run the Streamlit application:
    ```sh
    streamlit run app.py
    ```
7. Open your web browser and visit `http://localhost:8500` to access the OpenETL application.

## Docker Containers

- **openetl**: The main container running the OpenETL Streamlit application.

## Need More?

If the features in the base version of OpenETL aren't quite cutting it for you, fear not! We're here to help. If you require additional functionality, customizations, or have specific requirements, simply reach out to us.

## Support and Feedback

If you encounter any issues or have suggestions for improving OpenETL, please don't hesitate to open an issue in the GitHub repository. We greatly appreciate your feedback and are dedicated to enhancing the application based on user input. You can read the proper way to report issues in the [Security Section](SECURITY.md).

## License

This project is licensed under the [Apache 2.0 License](LICENSE).

Thank you for choosing OpenETL! We hope it simplifies your ETL tasks and provides a seamless experience.
