<?php
// Contact / offerte form handler (used by /contact and the homepage form via assets/js/contact.js).
// Returns an HTML fragment. contact.js treats a response containing "success" (the #success_msg div)
// as a sent message and fires the GA4 generate_lead event, so keep that marker.

if (!$_POST) exit;

if (!defined("EOL")) define("EOL", "\r\n");

function field($key) {
	return isset($_POST[$key]) && is_string($_POST[$key]) ? trim($_POST[$key]) : '';
}

// Strip line breaks from anything that ends up in a mail header (header injection).
function one_line($value) {
	return trim(preg_replace('/[\r\n\t]+/', ' ', $value));
}

function fail($message) {
	echo '<div class="error_msg">' . $message . '</div>';
	exit();
}

function success_html($name) {
	echo "<fieldset>";
	echo "<div id='success_msg'>";
	echo "<h3>Bericht succesvol verzonden.</h3>";
	echo "<p>Bedankt <strong>" . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . "</strong>, uw bericht is verstuurd. Ik neem zo snel mogelijk contact met u op.</p>";
	echo "</div>";
	echo "</fieldset>";
}

$name          = one_line(field('name'));
$email         = one_line(field('email'));
$phone         = one_line(field('phone'));
$comments      = field('comments');
$customer_type = field('customer_type');
$service       = field('service');
$subject       = one_line(field('subject')); // legacy field, optional

// Honeypot: real visitors never see or fill this field.
if (field('website') !== '') {
	success_html($name);
	exit();
}

$allowed_types = array('Zakelijk', 'Particulier');
$allowed_services = array(
	'Glasbewassing', 'Kozijnen conserveren', 'Gevelreiniging', 'Gevel impregneren', 'Dak reinigen',
	'Graffiti verwijderen', 'Voegherstel', 'Spinnen weren', 'Buitenreiniging (terras, dakgoot, zonnepanelen)',
	'Periodiek onderhoud VvE of bedrijf', 'Weet ik nog niet / advies'
);

if ($customer_type !== '' && !in_array($customer_type, $allowed_types, true)) $customer_type = '';
if ($service !== '' && !in_array($service, $allowed_services, true)) $service = '';

if ($name === '') {
	fail('Vul uw naam in.');
}
if ($phone === '' && $email === '') {
	fail('Vul uw telefoonnummer of e-mailadres in, zodat ik contact met u kan opnemen.');
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
	fail('U heeft een ongeldig e-mailadres ingevuld. Controleer het adres en probeer het opnieuw.');
}
if ($phone !== '' && !preg_match('/^[0-9+()\-\s.]{8,20}$/', $phone)) {
	fail('Controleer uw telefoonnummer; gebruik alleen cijfers, spaties of een +.');
}
if (trim($comments) === '') {
	fail('Vul uw bericht in.');
}

// Send to
$address = "info@baarsglasengevelwerken.nl";

$subject_parts = array();
if ($service !== '') $subject_parts[] = $service;
if ($customer_type !== '') $subject_parts[] = $customer_type;
if ($subject !== '') $subject_parts[] = $subject;
$e_subject = 'Offerteaanvraag website' . (count($subject_parts) ? ': ' . implode(' - ', $subject_parts) : '');
$e_subject_encoded = '=?UTF-8?B?' . base64_encode($e_subject) . '?=';

$e_body  = "Naam: $name" . EOL;
$e_body .= "Telefoon: " . ($phone !== '' ? $phone : '-') . EOL;
$e_body .= "E-mail: " . ($email !== '' ? $email : '-') . EOL;
$e_body .= "Type: " . ($customer_type !== '' ? $customer_type : '-') . EOL;
$e_body .= "Dienst: " . ($service !== '' ? $service : '-') . EOL;
if ($subject !== '') $e_body .= "Onderwerp: $subject" . EOL;
$e_body .= EOL . $comments . EOL;

$text_message = quoted_printable_encode($e_body);

$from_address = "noreply@baarsglasengevelwerken.nl";
$headers = "From: Baars Glas en Gevelwerken <$from_address>" . PHP_EOL;
if ($email !== '') {
	$headers .= "Reply-To: $email" . PHP_EOL;
}
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
		fail('Te veel bestanden (max 5).');
	}

	$allowed_ext = array('jpg', 'jpeg', 'png', 'webp', 'pdf');
	$boundary = md5(uniqid(time(), true));
	$headers .= "Content-Type: multipart/mixed; boundary=\"" . $boundary . "\"" . PHP_EOL;

	$msg  = "--" . $boundary . PHP_EOL;
	$msg .= "Content-Type: text/plain; charset=utf-8" . PHP_EOL;
	$msg .= "Content-Transfer-Encoding: quoted-printable" . PHP_EOL . PHP_EOL;
	$msg .= $text_message . PHP_EOL . PHP_EOL;

	foreach ($valid_attachments as $a) {
		$file_size = (int) $a['size'];
		if ($file_size > 5 * 1024 * 1024) {
			fail('Bestand is te groot (max 5 MB).');
		}

		$orig_name = $a['name'];
		$tmp_name = $a['tmp_name'];

		$ext = strtolower(pathinfo($orig_name, PATHINFO_EXTENSION));
		if (!in_array($ext, $allowed_ext)) {
			fail('Ongeldig bestandstype. Toegestaan: jpg, jpeg, png, webp, pdf.');
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
			fail('Kan het geüploade bestand niet lezen.');
		}

		$msg .= "--" . $boundary . PHP_EOL;
		$msg .= "Content-Type: " . $mime_type . "; name=\"" . $clean_name . "\"" . PHP_EOL;
		$msg .= "Content-Transfer-Encoding: base64" . PHP_EOL;
		$msg .= "Content-Disposition: attachment; filename=\"" . $clean_name . "\"" . PHP_EOL . PHP_EOL;
		$msg .= chunk_split(base64_encode($file_content)) . PHP_EOL;
	}

	$msg .= "--" . $boundary . "--";
} else {
	$headers .= "Content-Type: text/plain; charset=utf-8" . PHP_EOL;
	$headers .= "Content-Transfer-Encoding: quoted-printable" . PHP_EOL;
	$msg = $text_message;
}

if (mail($address, $e_subject_encoded, $msg, $headers)) {
	success_html($name);
} else {
	fail('Er is iets misgegaan bij het versturen. Bel of app 06 57 61 40 22 of mail naar <a href="mailto:info@baarsglasengevelwerken.nl">info@baarsglasengevelwerken.nl</a>.');
}
