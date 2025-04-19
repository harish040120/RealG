import cv2
import numpy as np
from ultralytics import YOLO

# Load YOLO model
model = YOLO('H:/Construction_Safety/project/backend/best.onnx')

# Open webcam
cap = cv2.VideoCapture(0)

# Variables for red zone selection
drawing = False  # True if mouse is pressed
vertices = []  # List to store red zone vertices
freeze_frame = False  # Flag to freeze the frame
frame = None  # Current frame
red_zone_defined = False  # Flag to check if red zone is defined
temp_vertices = []  # Temporary vertices for red zone drawing
max_vertices = 4  # Limit to four vertices for red zone

# Button parameters
button_x = 500  # x-coordinate of the button
button_y = 10  # y-coordinate of the button
button_width = 100
button_height = 30
button_color = (200, 200, 200)  # Light gray
button_text_color = (0, 0, 0)  # Black
freeze_button_pressed = False

# Class names to detect
valid_classes = [
    "Hardhat",
    "Mask",
    "NO-Hardhat",
    "NO-Mask",
    "NO-Safety Vest",
    "Person",
    "Safety Cone",
    "Safety Vest",
    "machinery",
    "vehicle",
]


def draw_button(img, text, x, y, w, h, color, text_color):
    cv2.rectangle(img, (x, y), (x + w, y + h), color, -1)
    cv2.putText(img, text, (x + 10, y + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 2)


def is_button_pressed(x, y, button_x, button_y, button_width, button_height):
    return button_x < x < button_x + button_width and button_y < y < button_y + button_height


def mouse_drawing(event, x, y, flags, param):
    global drawing, vertices, frame, red_zone_defined, freeze_frame, freeze_button_pressed, temp_vertices

    # Button press check
    if event == cv2.EVENT_LBUTTONDOWN and is_button_pressed(x, y, button_x, button_y, button_width, button_height):
        freeze_button_pressed = True
        freeze_frame = not freeze_frame
        if not freeze_frame:
            if len(temp_vertices) == max_vertices:
                vertices = temp_vertices  # Assign temp_vertices to vertices
                red_zone_defined = True
                print("Red zone selection saved.")
            else:
                red_zone_defined = False
                vertices = []
                print("Red zone selection reset.")
            temp_vertices = []  # Clear temporary vertices
        else:
            # When freezing, reset red zone definition to allow changes
            red_zone_defined = False
            vertices = []
            temp_vertices = []
            print("Frame frozen. Define/Redefine red zone.")
        freeze_button_pressed = False
    elif freeze_frame and event == cv2.EVENT_LBUTTONDOWN and len(temp_vertices) < max_vertices and not freeze_button_pressed:
        drawing = True
        temp_vertices.append((x, y))
        print(f"Vertex added: ({x}, {y})")  # Debugging
        if len(temp_vertices) == max_vertices:
            drawing = False
            print("Red zone defined with 4 vertices.")
    elif event == cv2.EVENT_LBUTTONUP:
        drawing = False


# Create window and set mouse callback
cv2.namedWindow("YOLO Webcam")
cv2.setMouseCallback("YOLO Webcam", mouse_drawing)


def is_inside_red_zone(bbox, vertices, threshold=0.20):
    """
    Checks if at least a certain percentage of a bounding box is inside a red zone defined by vertices.

    Args:
        bbox (tuple): Bounding box coordinates (x1, y1, x2, y2).
        vertices (list): List of vertices defining the red zone.
        threshold (float): The minimum percentage of the bounding box area that must be inside the red zone to be considered inside.

    Returns:
        bool: True if the bounding box is inside the red zone, False otherwise.
    """
    x1, y1, x2, y2 = bbox
    bbox_area = (x2 - x1) * (y2 - y1)

    # Create a mask for the bounding box
    mask = np.zeros((frame.shape[0], frame.shape[1]), dtype=np.uint8)
    cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)

    # Create a mask for the red zone
    red_zone_mask = np.zeros((frame.shape[0], frame.shape[1]), dtype=np.uint8)
    cv2.fillPoly(red_zone_mask, [np.array(vertices, np.int32)], 255)

    # Calculate the intersection area
    intersection = cv2.bitwise_and(mask, red_zone_mask)
    intersection_area = np.count_nonzero(intersection)

    # Calculate the percentage of the bounding box inside the red zone
    percentage_inside = intersection_area / bbox_area

    return percentage_inside >= threshold


while cap.isOpened():
    if not freeze_frame:
        ret, frame = cap.read()
        if not ret:
            break

    img = frame.copy()  # Create a copy for drawing

    # Draw the button
    button_text = "Freeze" if not freeze_frame else "Unfreeze"
    draw_button(img, button_text, button_x, button_y, button_width, button_height, button_color, button_text_color)

    if freeze_frame and not red_zone_defined and frame is not None:
        # Draw current vertices on the frame and join them
        if len(temp_vertices) > 0:
            cv2.polylines(img, [np.array(temp_vertices, np.int32).reshape((-1, 1, 2))], isClosed=False,
                          color=(0, 0, 255), thickness=2)
            # Draw circles at each vertex
            for vertex in temp_vertices:
                cv2.circle(img, vertex, 5, (0, 0, 255), -1)  # Red circle

            # If 4 vertices are selected, close the polygon
            if len(temp_vertices) == max_vertices:
                cv2.polylines(img, [np.array(temp_vertices, np.int32).reshape((-1, 1, 2))], isClosed=True,
                              color=(0, 0, 255), thickness=2)

        if len(temp_vertices) < max_vertices:
            cv2.putText(img,
                        f"Define Red Zone ({len(temp_vertices)}/{max_vertices} vertices, click to add)",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        else:
            cv2.putText(img, "Red Zone Defined. Press 'Unfreeze'", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7,
                        (0, 0, 255), 2)

    elif red_zone_defined and frame is not None:
        # Draw red zone with shading
        overlay = img.copy()
        pts = np.array(vertices, np.int32)
        cv2.fillPoly(overlay, [pts], color=(0, 0, 255))  # Red color
        alpha = 0.3  # Adjust transparency as desired
        cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)

        # Perform object detection and count people in the red zone
        results = model(frame)
        person_count = 0

        for r in results:
            for box in r.boxes:
                confidence = box.conf[0].item()
                if confidence > 0.5:  # Only display results with confidence > 0.5
                    x1, y1, x2, y2 = map(int, box.xyxy[0])  # Bounding box coordinates
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]

                    if class_name in valid_classes:
                        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        label = f"{class_name} {confidence:.2f}"
                        cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                if class_name in valid_classes:
                    # Check if the person is inside the red zone
                    bbox = (x1, y1, x2, y2)
                    if is_inside_red_zone(bbox, vertices):  # Use the new function
                        person_count += 1
                        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 2)  # Red box for people in zone
                    else:
                        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)  # Green box for people outside zone

                    label = f"{class_name} {conf:.2f}"
                    cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Display the count
        if len(vertices) == 4:
            cv2.polylines(img, [np.array(vertices, np.int32).reshape((-1, 1, 2))], isClosed=True,
                          color=(0, 0, 255), thickness=2)
        cv2.putText(img, f"People in Red Zone: {person_count}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7,
                    (0, 0, 255), 2)
    elif frame is not None:
        # Object detection without red zone counting
        results = model(frame)

        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])  # Bounding box coordinates
                conf = box.conf[0].item()  # Confidence score
                class_id = int(box.cls[0])
                class_name = model.names[class_id]

                if class_name in valid_classes:
                    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    label = f"{class_name} {conf:.2f}"
                    cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    cv2.imshow("YOLO Webcam", img)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()