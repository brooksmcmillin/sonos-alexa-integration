<?php
	$value = $_POST["data"];
	
	$margin = 7500;
	
	//echo $value . "<br>";
	$command = "";
	
	switch($value)
	{
		case "up":
			$command = "C:\\Users\\Brooks\\Documents\\nircmd-x64\\nircmd.exe changesysvolume {$margin}";
			break;
			
		case "down":
			$command = "C:\\Users\\Brooks\\Documents\\nircmd-x64\\nircmd.exe changesysvolume -{$margin}";
			break;
	}
	
	//echo $command . "<br>";
	exec($command . ' 2>&1', $output);
	///echo "Done<br>";
	//var_dump($output);
	
	header("Location: index.html");
?>