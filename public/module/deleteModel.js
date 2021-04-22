function send_to_delete(id) {
  var item = document.getElementById(id.toString())
  console.log(item)
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        type: "POST",
        url: "/delete",
        data: { id: id },
        success: function (data) {
          console.log(data);
        },
      });
      
      item.remove();
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Delete success",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  });
}
