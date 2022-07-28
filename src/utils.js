export function cleanPath(filepath) {
	// Remove '/' as first character
	if (filepath.substring(0, 1) == '/') {
		filepath = filepath.substring(1);
	}

	// Add '*' on directories
	if (filepath.substring(filepath.length - 1, filepath.length) == '/') {
		filepath += '*';
	}

	return filepath;
}