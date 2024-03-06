from flask import Flask, request, jsonify, json
from ABC.ABC_VRPTW import run

app = Flask(__name__)

@app.route('/')
def hello_world():

    return 'Send a post request at /optimizeRoute!'

@app.route('/optimizeRoute', methods=['POST'])
def receive_json():
    try:
        data = request.json  # Access JSON data from the request

        # Save the JSON data to ./ABC/data/json/input.json
        with open('./data/json/input.json', 'w') as f:
            f.write(json.dumps(data))  # Use json.dumps to convert the Python object to a JSON string
        
        response = run()  # Run the ABC algorithm
        
        return jsonify(response), 200
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
