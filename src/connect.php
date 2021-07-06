<?php
    

     $servername = "127.0.0.1";
     $username = "root";
     $dbpassword = "";
     $dbname = "test";
//)8f46D1_ZlNg\b>u
     $conn = mysqli_connect($servername,$username,$dbpassword,$dbname);
     if($conn)
     {
      //   echo "Connection Established";
     }
     else
     {
        echo "Connection failed".mysqli_connect_error();
     }

     

?>