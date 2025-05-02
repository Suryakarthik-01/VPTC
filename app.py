from flask import Flask, request, jsonify, render_template
import json
from datetime import datetime

app = Flask(__name__)
DATA_FILE = 'video_progress.json'

def load_progress():
    """Loads video progress data from the JSON file."""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        data = {}
    return data

def save_progress(data):
    """Saves video progress data to the JSON file."""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def merge_intervals(intervals):
    """Merges overlapping intervals."""
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [list(intervals[0])]
    for current_start, current_end in intervals[1:]:
        prev_start, prev_end = merged[-1]
        if current_start <= prev_end:
            merged[-1][1] = max(prev_end, current_end)
        else:
            merged.append([current_start, current_end])
    return [[int(start), int(end)] for start, end in merged]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/progress/<user_id>/<video_id>', methods=['GET'])
def get_progress(user_id, video_id):
    """Retrieves the video progress for a specific user and video."""
    data = load_progress()
    user_progress = data.get(user_id, {}).get(video_id, {'watched_segments': [], 'last_watched': None})
    return jsonify(user_progress)

@app.route('/api/progress/<user_id>/<video_id>', methods=['POST'])
def update_progress(user_id, video_id):
    """Updates the video progress for a specific user and video."""
    data = load_progress()
    user_data = data.setdefault(user_id, {})
    video_data = user_data.setdefault(video_id, {'watched_segments': [], 'last_watched': None})

    new_segments = request.json.get('watched_segments', [])
    last_watched_time = request.json.get('last_watched')

    if new_segments:
        updated_segments = video_data['watched_segments'] + new_segments
        video_data['watched_segments'] = merge_intervals(updated_segments)

    if last_watched_time:
        video_data['last_watched'] = last_watched_time

    save_progress(data)
    return jsonify({'message': 'Progress updated successfully'})

if __name__ == '__main__':
    app.run(debug=True)