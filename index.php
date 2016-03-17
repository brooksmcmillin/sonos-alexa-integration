<?php
	
	require_once __DIR__ . "/vendor/autoload.php";
	
	$volumeLevel = $_GET["volume"];
	
	echo '{ "data": "The Volume is ' . $volumeLevel . '!"}';
	

	$file = 'log.txt';
	// Open the file to get existing content
	$current = file_get_contents($file);
	// Append a new person to the file
	$current .= "\nChanging Volume to " . $volumeLevel;
	// Write the contents back to the file
	file_put_contents($file, $current);
	
?>
