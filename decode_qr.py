import cv2
from pyzbar.pyzbar import decode
import sys

def decode_qr(image_path):
    img = cv2.imread(image_path)
    decoded_objects = decode(img)
    for obj in decoded_objects:
        print(f"Data: {obj.data.decode('utf-8')}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        decode_qr(sys.argv[1])
    else:
        print("Usage: python decode_qr.py <image_path>")
