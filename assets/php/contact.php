<?php

if(!$_POST) exit;

// Email address verification
function isEmail($email) {
	return(preg_match("/^[-_.[:alnum:]]+@((([[:alnum:]]|[[:alnum:]][[:alnum:]-]*[[:alnum:]])\.)+(ad|ae|aero|af|ag|ai|al|am|an|ao|aq|ar|arpa|as|at|au|aw|az|ba|bb|bd|be|bf|bg|bh|bi|biz|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|com|coop|cr|cs|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|edu|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|in|info|int|io|iq|ir|is|it|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|mg|mh|mil|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|museum|mv|mw|mx|my|mz|na|name|nc|ne|net|nf|ng|ni|nl|no|np|nr|nt|nu|nz|om|org|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|pro|ps|pt|pw|py|qa|re|ro|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw)$|(([0-9][0-9]?|[0-1][0-9][0-9]|[2][0-4][0-9]|[2][5][0-5])\.){3}([0-9][0-9]?|[0-1][0-9][0-9]|[2][0-4][0-9]|[2][5][0-5]))$/i",$email));
}

if (!defined("PHP_EOL")) define("PHP_EOL", "\r\n");

$name     = $_POST['name'];
$email    = $_POST['email'];
$subject  = isset($_POST['subject']) ? $_POST['subject'] : '';
$customer_type = isset($_POST['customer_type']) ? $_POST['customer_type'] : '';
$phone = isset($_POST['phone']) ? $_POST['phone'] : '';
$comments = $_POST['comments'];

if(trim($name) == '') {
	echo '<div class="error_msg">You must enter your name.</div>';
	exit();
} else if(trim($email) == '') {
	echo '<div class="error_msg">Please enter a valid email address.</div>';
	exit();
} else if(!isEmail($email)) {
	echo '<div class="error_msg">You have entered an invalid e-mail address. Please try again.</div>';
	exit();
}

if(trim($comments) == '') {
	echo '<div class="error_msg">Please enter your message.</div>';
	exit();
}

if(trim($phone) == '') {
	echo '<div class="error_msg">Please enter a phone number.</div>';
	exit();
}

if(trim($subject) == '') {
	echo '<div class="error_msg">Please enter a subject.</div>';
	exit();
}

if(trim($customer_type) == '') {
	echo '<div class="error_msg">Please select Particulier or Zakelijk.</div>';
	exit();
}

if (function_exists('get_magic_quotes_gpc') && get_magic_quotes_gpc()) {
	$comments = stripslashes($comments);
}



// Send to
$address = "info@baarsglasengevelwerken.nl";


$e_subject = 'Contactformulier: ' . $subject;


$e_body = "Contactformulier" . PHP_EOL . PHP_EOL;
$e_body .= "Type: $customer_type" . PHP_EOL;
$e_body .= "Naam: $name" . PHP_EOL;
$e_body .= "Email: $email" . PHP_EOL;
$e_body .= "Telefoon: $phone" . PHP_EOL;
$e_body .= "Onderwerp: $subject" . PHP_EOL . PHP_EOL;
$e_body .= "Bericht:" . PHP_EOL;
$e_content = "\"$comments\"" . PHP_EOL . PHP_EOL;
$e_reply = "U kunt contact opnemen via $email";

$text_message = wordwrap( $e_body . $e_content . $e_reply, 70 );

$from_address = "noreply@baarsglasengevelwerken.nl";
$headers = "From: $from_address" . PHP_EOL;
$headers .= "Reply-To: $email" . PHP_EOL;
$headers .= "MIME-Version: 1.0" . PHP_EOL;

$files = isset($_FILES['attachment']) ? $_FILES['attachment'] : null;
$attachments = array();

if ($files && isset($files['name'])) {
	if (is_array($files['name'])) {
		for ($i = 0; $i < count($files['name']); $i++) {
			$attachments[] = array(
				'name' => $files['name'][$i],
				'tmp_name' => $files['tmp_name'][$i],
				'size' => $files['size'][$i],
				'error' => $files['error'][$i]
			);
		}
	} else {
		$attachments[] = array(
			'name' => $files['name'],
			'tmp_name' => $files['tmp_name'],
			'size' => $files['size'],
			'error' => $files['error']
		);
	}
}

$valid_attachments = array();
foreach ($attachments as $a) {
	if (!isset($a['error']) || $a['error'] !== UPLOAD_ERR_OK) continue;
	$valid_attachments[] = $a;
}

if (count($valid_attachments) > 0) {
	if (count($valid_attachments) > 5) {
		echo '<div class="error_msg">Too many files (max 5).</div>';
		exit();
	}

	$allowed_ext = array('jpg','jpeg','png','webp','pdf');
	$boundary = md5(uniqid(time(), true));
	$headers .= "Content-Type: multipart/mixed; boundary=\"" . $boundary . "\"" . PHP_EOL;

	$msg = "--" . $boundary . PHP_EOL;
	$msg .= "Content-Type: text/plain; charset=utf-8" . PHP_EOL;
	$msg .= "Content-Transfer-Encoding: quoted-printable" . PHP_EOL . PHP_EOL;
	$msg .= $text_message . PHP_EOL . PHP_EOL;

	foreach ($valid_attachments as $a) {
		$file_size = (int) $a['size'];
		if ($file_size > 5 * 1024 * 1024) {
			echo '<div class="error_msg">File is too large (max 5MB).</div>';
			exit();
		}

		$orig_name = $a['name'];
		$tmp_name = $a['tmp_name'];

		$ext = strtolower(pathinfo($orig_name, PATHINFO_EXTENSION));
		if (!in_array($ext, $allowed_ext)) {
			echo '<div class="error_msg">Invalid file type. Allowed: jpg, jpeg, png, webp, pdf.</div>';
			exit();
		}

		if (function_exists('finfo_open')) {
			$finfo = finfo_open(FILEINFO_MIME_TYPE);
			$mime_type = $finfo ? finfo_file($finfo, $tmp_name) : 'application/octet-stream';
			if ($finfo) finfo_close($finfo);
		} else {
			$mime_type = 'application/octet-stream';
		}

		$clean_name = preg_replace('/[^A-Za-z0-9._-]/', '_', $orig_name);
		$file_content = file_get_contents($tmp_name);
		if ($file_content === false) {
			echo '<div class="error_msg">Could not read uploaded file.</div>';
			exit();
		}

		$msg .= "--" . $boundary . PHP_EOL;
		$msg .= "Content-Type: " . $mime_type . "; name=\"" . $clean_name . "\"" . PHP_EOL;
		$msg .= "Content-Transfer-Encoding: base64" . PHP_EOL;
		$msg .= "Content-Disposition: attachment; filename=\"" . $clean_name . "\"" . PHP_EOL . PHP_EOL;
		$msg .= chunk_split(base64_encode($file_content)) . PHP_EOL;
	}

	$msg .= "--" . $boundary . "--";
} else {
	$headers .= "Content-type: text/plain; charset=utf-8" . PHP_EOL;
	$headers .= "Content-Transfer-Encoding: quoted-printable" . PHP_EOL;
	$msg = $text_message;
}

if(mail($address, $e_subject, $msg, $headers)) {

	// Email has sent successfully, echo a success page.

	echo "<fieldset>";
	echo "<div id='success_msg'>";
	echo "<h3>Email Sent Successfully.</h3>";
	echo "<p>Thank you <strong>$name</strong>, your message has been submitted to us.</p>";
	echo "</div>";
	echo "</fieldset>";

} else {

	echo 'ERROR!';

}