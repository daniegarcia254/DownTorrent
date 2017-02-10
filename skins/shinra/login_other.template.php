<?php defined("NET2FTP") or die("Direct access to this location is not allowed."); ?>
<!-- Template /skins/shinra/login_other.template.php begin -->
	<!-- WRAPPER -->
	<div id="wrapper">
			
		<!-- HEADER -->
		<div id="header">
			<h1><span>danigarcia-dev.com</span> FTP client</h1>
		</div>
		<!-- ENDS HEADER -->
			
		<!-- MAIN -->
		<div id="main">

			<!-- content -->
			<div id="content">
				
				<!-- title -->
				<div id="page-title">
					<span class="title">Login</span>
					<span class="subtitle">Connect to your FTP server and start editing your website now.</span>
				</div>
				<!-- ENDS title -->
				
				<!-- Posts -->
				<div id="posts">

					<!-- post -->
					<div class="post">

<?php require_once($net2ftp_globals["application_skinsdir"] . "/" . $net2ftp_globals["skin"] . "/loginform.template.php"); ?>

					</div>
					<!-- ENDS post -->
			
				</div>
				<!-- ENDS Posts -->


<?php require_once($net2ftp_globals["application_skinsdir"] . "/" . $net2ftp_globals["skin"] . "/footer.template.php"); ?>

<!-- Template /skins/shinra/login_other.template.php end -->
