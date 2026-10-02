// Maps YouCam engine and HTTP error codes to plain-language messages.
// `retake` = the fix is a new photo; otherwise the user can simply retry.

type Mapped = { message: string; retake: boolean };

const ENGINE: Record<string, Mapped> = {
  error_mismatch_image_size: { message: "The three texture-scan photos came out different sizes. Please retake the side photos.", retake: true },
  error_below_min_image_size: { message: "The photo is too small. Use a photo at least 320 px on each side.", retake: true },
  error_face_position_invalid: { message: "Your whole face needs to be in the photo, with nothing cut off.", retake: true },
  error_face_position_too_small: { message: "Your face is too small in the frame. Move a little closer.", retake: true },
  error_face_position_out_of_boundary: { message: "Your face is too close or partly outside the frame. Step back a little.", retake: true },
  error_insufficient_lighting: { message: "The photo is too dark. Face a window or a light.", retake: true },
  error_face_angle_invalid: { message: "Look straight at the camera with your head level.", retake: true },
  error_no_face: { message: "We couldn't find a face. Use a front-facing photo.", retake: true },
  error_pose: { message: "We couldn't read your pose. Face the camera with shoulders visible.", retake: true },
  error_face_parsing: { message: "We couldn't separate hair from face. Try even lighting and a plain background.", retake: true },
  error_no_shoulder: { message: "Your shoulders need to be visible. Hold the camera a bit further away.", retake: true },
  error_large_face_angle: { message: "Your head is turned too far. Face the camera directly.", retake: true },
  error_insufficient_landmarks: { message: "We couldn't see enough of your face and shoulders. Try a clearer, front-facing photo.", retake: true },
  error_face_pose: { message: "This head angle isn't supported. Look straight ahead.", retake: true },
  error_hair_too_short: { message: "YouCam can't restyle hair this short with this template. Try a different target or photo.", retake: false },
  error_nsfw_content_detected: { message: "This photo can't be processed. Please use a different photo.", retake: true },
  exceed_nsfw_retry_limits: { message: "This photo can't be processed. Please use a different photo.", retake: true },
  error_decode_image: { message: "The photo file couldn't be read. Try another JPG or PNG.", retake: true },
  error_download_image: { message: "YouCam couldn't read the uploaded photo. Please try again.", retake: false },
  exceed_max_filesize: { message: "The photo file is too large.", retake: true },
  invalid_parameter: { message: "Something in the request was invalid. Please try again.", retake: false },
  error_inference: { message: "YouCam had a processing error. Please try again.", retake: false },
  error_upload: { message: "YouCam couldn't save the result. Please try again.", retake: false },
  unknown_internal_error: { message: "YouCam had an unexpected error. Please try again.", retake: false },
};

const HTTP: Record<string, string> = {
  CreditInsufficiency: "The demo has run out of YouCam units. Please try again later.",
  InvalidApiKey: "The server's YouCam key is not valid.",
  InactiveApiKey: "The server's YouCam key is inactive.",
  ExpiredApiKey: "The server's YouCam key has expired.",
  InvalidTaskId: "That task has expired. Please start again.",
  TaskTimeout: "YouCam took too long on this task. Please try again.",
  InvalidStyle: "This hairstyle template isn't available right now.",
  missing_api_key: "The server has no YouCam API key configured.",
  provider_timeout: "YouCam took too long to respond. Please try again.",
  provider_unreachable: "Couldn't reach YouCam. Check your connection and try again.",
  http_429: "Too many requests right now. Please wait a moment and try again.",
};

export function mapEngineError(code: string | null | undefined, fallback?: string): Mapped {
  if (code && ENGINE[code]) return ENGINE[code];
  return { message: fallback || "YouCam couldn't finish this task. Please try again.", retake: false };
}

export function mapHttpError(code: string, fallback: string): string {
  return HTTP[code] || fallback;
}
