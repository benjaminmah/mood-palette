import random
from flask import Flask, request, jsonify, render_template
from deepface import DeepFace
import os

WINDOWS = True

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze_mood', methods=['POST'])
def analyze_mood():
    # Retrieve the image data sent from the client
    image_file = request.files['image']

    # Save the file to a specific folder
    if WINDOWS:
        folder_path = "C:\\Users\\Benjamin Mah\\Documents\\GITHUB\\mood-palette\\images"  # Specify the folder path

    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    else:
        clear_directory(folder_path)
    
    file_path = os.path.join(folder_path, "captured_image.png")
    image_file.save(file_path)


    mood = analyze_mood_with_model(file_path)

    # Return the mood analysis results
    return jsonify({'mood': mood})

def analyze_mood_with_model(file_path):
    face_analysis = DeepFace.analyze(img_path = file_path)
    # Return the mood result as a string or any desired format
    return face_analysis[0]["dominant_emotion"]  # Replace this with the actual mood result

def clear_directory(directory_path):
    # Get the list of files and directories in the target directory
    file_list = os.listdir(directory_path)

    # Iterate over the file list and remove files and directories
    for file_name in file_list:
        file_path = os.path.join(directory_path, file_name)
        if os.path.isfile(file_path):
            os.remove(file_path)
        elif os.path.isdir(file_path):
            os.rmdir(file_path)

    print("Directory cleared successfully:", directory_path)

if __name__ == '__main__':
    app.run()
