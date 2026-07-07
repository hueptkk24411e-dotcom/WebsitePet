var groomingData = null;

function loadSharedGroomingData() {
  if (groomingData) return Promise.resolve(groomingData);

  return Promise.all([
    loadJSON('../assets/dataset/grooming-services.json'),
    loadJSON('../assets/dataset/grooming-groomers.json'),
    loadJSON('../assets/dataset/grooming-schedules.json')
  ])
    .then(function (results) {
      var services = Array.isArray(results[0]) ? results[0] : [];
      var groomers = Array.isArray(results[1]) ? results[1] : [];
      var schedules = Array.isArray(results[2]) ? results[2] : [];

      try {
        var storedServices = localStorage.getItem('petopia_grooming_services');
        if (storedServices) services = JSON.parse(storedServices);
        var storedGroomers = localStorage.getItem('petopia_grooming_groomers');
        if (storedGroomers) groomers = JSON.parse(storedGroomers);
        var storedSchedules = localStorage.getItem('petopia_grooming_schedules');
        if (storedSchedules) schedules = JSON.parse(storedSchedules);
      } catch (err) {
        console.warn(err);
      }

      groomingData = { services: services, groomers: groomers, schedules: schedules };
      return groomingData;
    });
}

function persistGroomingData() {
  if (!groomingData) return;
  localStorage.setItem('petopia_grooming_services', JSON.stringify(groomingData.services));
  localStorage.setItem('petopia_grooming_groomers', JSON.stringify(groomingData.groomers));
  localStorage.setItem('petopia_grooming_schedules', JSON.stringify(groomingData.schedules));
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('servicesTableBody')) {
    loadServicesPage();
  }

  if (document.getElementById('groomersTableBody')) {
    loadGroomersPage();
  }

  if (document.getElementById('scheduleTableBody')) {
    loadSchedulePage();
  }
});

function loadServicesPage() {
  loadSharedGroomingData()
    .then(function (data) {
      renderServicesTable(data.services, data.groomers, data.schedules);
      bindServiceActions();
      bindAddButton('addServiceBtn', function () {
        openServiceModal(null);
      });
    })
    .catch(function (err) {
      console.error(err);
      showToast('Không tải được dữ liệu dịch vụ grooming', 'error');
    });
}

function loadGroomersPage() {
  loadSharedGroomingData()
    .then(function (data) {
      renderGroomersTable(data.groomers, data.schedules);
      bindGroomerActions();
      bindAddButton('addGroomerBtn', function () {
        openGroomerModal(null);
      });
    })
    .catch(function (err) {
      console.error(err);
      showToast('Không tải được dữ liệu groomer', 'error');
    });
}

function loadSchedulePage() {
  loadSharedGroomingData()
    .then(function (data) {
      renderScheduleTable(data.schedules, data.services, data.groomers);
      bindScheduleActions();
      bindAddButton('addScheduleBtn', function () {
        openScheduleModal(null);
      });
    })
    .catch(function (err) {
      console.error(err);
      showToast('Không tải được lịch grooming', 'error');
    });
}

function bindAddButton(id, handler) {
  var btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', handler);
  }
}

function bindServiceActions() {
  var tbody = document.getElementById('servicesTableBody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach(function (row) {
    var id = row.getAttribute('data-service-id');
    var editBtn = row.querySelector('.icon-btn');
    var delBtn = row.querySelector('.icon-btn.danger');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var service = groomingData.services.find(function (item) {
          return item.id === id;
        });
        openServiceModal(service);
      });
    }
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        if (!window.confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
        groomingData.services = groomingData.services.filter(function (item) {
          return item.id !== id;
        });
        persistGroomingData();
        renderServicesTable(groomingData.services, groomingData.groomers, groomingData.schedules);
        bindServiceActions();
        showToast('Đã xóa dịch vụ');
      });
    }
  });
}

function bindGroomerActions() {
  var tbody = document.getElementById('groomersTableBody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach(function (row) {
    var id = row.getAttribute('data-groomer-id');
    var editBtn = row.querySelector('.icon-btn');
    var delBtn = row.querySelector('.icon-btn.danger');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var groomer = groomingData.groomers.find(function (item) {
          return item.id === id;
        });
        openGroomerModal(groomer);
      });
    }
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        if (!window.confirm('Bạn có chắc muốn xóa groomer này?')) return;
        groomingData.groomers = groomingData.groomers.filter(function (item) {
          return item.id !== id;
        });
        groomingData.schedules = groomingData.schedules.filter(function (item) {
          return item.groomerId !== id;
        });
        persistGroomingData();
        renderGroomersTable(groomingData.groomers, groomingData.schedules);
        bindGroomerActions();
        showToast('Đã xóa groomer');
      });
    }
  });
}

function bindScheduleActions() {
  var tbody = document.getElementById('scheduleTableBody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach(function (row) {
    var id = row.getAttribute('data-schedule-id');
    var editBtn = row.querySelector('.icon-btn');
    var delBtn = row.querySelector('.icon-btn.danger');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var schedule = groomingData.schedules.find(function (item) {
          return item.id === id;
        });
        openScheduleModal(schedule);
      });
    }
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        if (!window.confirm('Bạn có chắc muốn xóa lịch này?')) return;
        groomingData.schedules = groomingData.schedules.filter(function (item) {
          return item.id !== id;
        });
        persistGroomingData();
        renderScheduleTable(groomingData.schedules, groomingData.services, groomingData.groomers);
        bindScheduleActions();
        showToast('Đã xóa lịch grooming');
      });
    }
  });
}

function updateGroomingStats(services, groomers, schedules) {
  var activeServices = services.filter(function (service) {
    return service.status !== 'inactive';
  }).length;
  var activeGroomers = groomers.filter(function (groomer) {
    return groomer.status !== 'offline';
  }).length;
  var todaySchedules = schedules.filter(function (schedule) {
    var date = new Date(schedule.date);
    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return date >= start && date < end;
  }).length;
  var confirmedSchedules = schedules.filter(function (schedule) {
    return schedule.status === 'confirmed';
  }).length;
  var pendingSchedules = schedules.filter(function (schedule) {
    return schedule.status === 'pending';
  }).length;
  var cancelledSchedules = schedules.filter(function (schedule) {
    return schedule.status === 'cancelled';
  }).length;
  var revenue = services.reduce(function (sum, service) {
    return sum + Number(service.basePrice || 0);
  }, 0);

  setText('servicesCount', services.length);
  setText('servicesBookings', schedules.length);
  setText('servicesRevenue', formatVND(revenue));
  setText('servicesGroomers', groomers.length);

  setText('groomerTotalCount', groomers.length);
  setText('groomerActiveCount', activeGroomers);
  setText('groomerTodayCount', todaySchedules);
  setText('groomerServiceCount', activeServices);

  setText('scheduleTotalCount', schedules.length);
  setText('scheduleConfirmedCount', confirmedSchedules);
  setText('schedulePendingCount', pendingSchedules);
  setText('scheduleCancelledCount', cancelledSchedules);
}

function renderServicesTable(services, groomers, schedules) {
  var tbody = document.getElementById('servicesTableBody');
  if (!tbody) return;

  tbody.innerHTML = services.map(function (service) {
    var serviceStatus = service.status === 'inactive' ? 'inactive' : 'active';
    var duration = getServiceDuration(service);
    var badgeClass = serviceStatus === 'active' ? 'completed' : 'pending';
    var badgeText = serviceStatus === 'active' ? 'Kích hoạt' : 'Tạm dừng';

    return '' +
      '<tr data-service-id="' + escapeHTML(service.id) + '">' +
      '<td><strong>' + escapeHTML(service.name) + '</strong><div class="cell-product-sub">' + escapeHTML(service.description || '') + '</div></td>' +
      '<td>' + escapeHTML(duration) + '</td>' +
      '<td><strong>' + formatVND(service.basePrice || 0) + '</strong></td>' +
      '<td><span class="badge ' + badgeClass + '">' + badgeText + '</span></td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn" title="Sửa dịch vụ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>' +
      '<button class="icon-btn danger" title="Xóa dịch vụ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg></button>' +
      '</td>' +
      '</tr>';
  }).join('');

  updateGroomingStats(services, groomers, schedules);
}

function renderGroomersTable(groomers, schedules) {
  var tbody = document.getElementById('groomersTableBody');
  if (!tbody) return;

  tbody.innerHTML = groomers.map(function (groomer) {
    var status = groomer.status === 'offline' ? 'offline' : 'active';
    var statusText = status === 'active' ? 'Đang làm' : 'Nghỉ';
    var statusClass = status === 'active' ? 'completed' : 'pending';

    return '' +
      '<tr data-groomer-id="' + escapeHTML(groomer.id) + '">' +
      '<td class="cell-product">' +
      '<img src="' + escapeHTML(groomer.avatar || '../assets/img/admin/avatar-dog.png') + '" alt="' + escapeHTML(groomer.name) + '">' +
      '<div class="cell-product-name">' + escapeHTML(groomer.name) + '</div>' +
      '</td>' +
      '<td>' + escapeHTML(groomer.phone || '') + '</td>' +
      '<td>' + escapeHTML(groomer.rating || '0') + '/5 (' + escapeHTML(groomer.reviews || 0) + ' đánh giá)</td>' +
      '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn" title="Sửa groomer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>' +
      '<button class="icon-btn danger" title="Xóa groomer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg></button>' +
      '</td>' +
      '</tr>';
  }).join('');

  var services = groomingData && groomingData.services ? groomingData.services : [];
  updateGroomingStats(services, groomers, groomingData && groomingData.schedules ? groomingData.schedules : []);
}

function renderScheduleTable(schedules, services, groomers) {
  var tbody = document.getElementById('scheduleTableBody');
  if (!tbody) return;

  tbody.innerHTML = schedules.map(function (schedule) {
    var statusClass = schedule.status === 'cancelled' ? 'shipping' : (schedule.status === 'pending' ? 'pending' : 'confirmed');
    var statusText = schedule.status === 'cancelled' ? 'Đã hủy' : (schedule.status === 'pending' ? 'Chờ xác nhận' : 'Đã xác nhận');
    var serviceName = getServiceName(schedule.serviceId, services);
    var groomerName = getGroomerName(schedule.groomerId, groomers);

    return '' +
      '<tr data-schedule-id="' + escapeHTML(schedule.id) + '">' +
      '<td>' + escapeHTML(formatDateTime(schedule.date)) + '</td>' +
      '<td>' + escapeHTML(schedule.petName || '') + '</td>' +
      '<td>' + escapeHTML(schedule.customerName || '') + '</td>' +
      '<td>' + escapeHTML(serviceName) + '</td>' +
      '<td>' + escapeHTML(groomerName) + '</td>' +
      '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn" title="Chỉnh sửa lịch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>' +
      '<button class="icon-btn danger" title="Xóa lịch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg></button>' +
      '</td>' +
      '</tr>';
  }).join('');

  var currentServices = groomingData && groomingData.services ? groomingData.services : services;
  var currentGroomers = groomingData && groomingData.groomers ? groomingData.groomers : groomers;
  updateGroomingStats(currentServices, currentGroomers, schedules);
}

function ensureCrudModal() {
  var modal = document.getElementById('groomingCrudModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'groomingCrudModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = '' +
    '<div class="modal-box">' +
      '<div class="modal-head">' +
        '<h3 id="groomingFormTitle">Form</h3>' +
        '<button class="modal-close-btn" type="button" data-close-modal="groomingCrudModal" aria-label="Đóng">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
        '</button>' +
      '</div>' +
      '<form id="groomingCrudForm" class="modal-body">' +
        '<div id="groomingFormBody"></div>' +
        '<div class="modal-foot">' +
          '<button class="btn-secondary" type="button" data-close-modal="groomingCrudModal">Hủy</button>' +
          '<button class="btn-primary" id="groomingCrudSave" type="submit">Lưu</button>' +
        '</div>' +
      '</form>' +
    '</div>';
  document.body.appendChild(modal);

  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeModal('groomingCrudModal');
    }
  });
  modal.querySelectorAll('[data-close-modal]').forEach(function (button) {
    button.addEventListener('click', function () {
      closeModal('groomingCrudModal');
    });
  });
  return modal;
}

function openCrudModal(title, fields, onSubmit, initialValues) {
  var modal = ensureCrudModal();
  document.getElementById('groomingFormTitle').textContent = title;
  var body = document.getElementById('groomingFormBody');
  body.innerHTML = fields.map(function (field) {
    var value = initialValues && Object.prototype.hasOwnProperty.call(initialValues, field.name) ? initialValues[field.name] : (field.value || '');
    if (field.type === 'select') {
      var options = (field.options || []).map(function (option) {
        var selected = value === option.value ? ' selected' : '';
        return '<option value="' + escapeHTML(option.value) + '"' + selected + '>' + escapeHTML(option.label) + '</option>';
      }).join('');
      return '' +
        '<div class="form-group">' +
          '<label for="' + escapeHTML(field.name) + '">' + escapeHTML(field.label) + '</label>' +
          '<select id="' + escapeHTML(field.name) + '" name="' + escapeHTML(field.name) + '" class="form-control">' + options + '</select>' +
        '</div>';
    }
    if (field.type === 'textarea') {
      return '' +
        '<div class="form-group">' +
          '<label for="' + escapeHTML(field.name) + '">' + escapeHTML(field.label) + '</label>' +
          '<textarea id="' + escapeHTML(field.name) + '" name="' + escapeHTML(field.name) + '" class="form-control"' + (field.required ? ' required' : '') + '>' + escapeHTML(value) + '</textarea>' +
        '</div>';
    }
    if (field.type === 'datetime-local') {
      return '' +
        '<div class="form-group">' +
          '<label for="' + escapeHTML(field.name) + '">' + escapeHTML(field.label) + '</label>' +
          '<input id="' + escapeHTML(field.name) + '" name="' + escapeHTML(field.name) + '" type="datetime-local" class="form-control" value="' + escapeHTML(value) + '"' + (field.required ? ' required' : '') + '>' +
        '</div>';
    }
    return '' +
      '<div class="form-group">' +
        '<label for="' + escapeHTML(field.name) + '">' + escapeHTML(field.label) + '</label>' +
        '<input id="' + escapeHTML(field.name) + '" name="' + escapeHTML(field.name) + '" type="' + escapeHTML(field.type || 'text') + '" class="form-control" value="' + escapeHTML(value) + '"' + (field.required ? ' required' : '') + (field.step ? ' step="' + escapeHTML(field.step) + '"' : '') + '>' +
      '</div>';
  }).join('');

  var form = document.getElementById('groomingCrudForm');
  form.onsubmit = function (event) {
    event.preventDefault();

    var values = {};
    var missing = false;
    fields.forEach(function (field) {
      var input = document.getElementById(field.name);
      var value = input ? input.value : '';
      values[field.name] = value;
      if (field.required && String(value).trim() === '') {
        missing = true;
      }
    });

    if (missing) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    onSubmit(values);
    closeModal('groomingCrudModal');
  };

  openModal('groomingCrudModal');
}

function openServiceModal(service) {
  var fields = [
    { name: 'name', label: 'Tên dịch vụ', type: 'text', required: true, value: service ? service.name : '' },
    { name: 'description', label: 'Mô tả', type: 'textarea', value: service ? service.description : '' },
    { name: 'basePrice', label: 'Giá (VNĐ)', type: 'number', required: true, value: service ? service.basePrice : 150000 },
    { name: 'duration', label: 'Thời gian', type: 'text', value: service ? getServiceDuration(service) : '30 phút' },
    { name: 'category', label: 'Loại', type: 'select', value: service ? service.category : 'basic', options: [{ value: 'basic', label: 'Cơ bản' }, { value: 'spa', label: 'Spa' }, { value: 'addon', label: 'Phụ kiện' }] },
    { name: 'status', label: 'Trạng thái', type: 'select', value: service && service.status === 'inactive' ? 'inactive' : 'active', options: [{ value: 'active', label: 'Kích hoạt' }, { value: 'inactive', label: 'Tạm dừng' }] }
  ];

  openCrudModal(service ? 'Sửa dịch vụ' : 'Thêm dịch vụ', fields, function (values) {
    var payload = {
      id: service ? service.id : ('service_' + Date.now()),
      name: values.name.trim(),
      description: values.description.trim(),
      basePrice: Number(values.basePrice) || 0,
      duration: values.duration.trim(),
      category: values.category,
      status: values.status
    };

    if (service) {
      groomingData.services = groomingData.services.map(function (item) {
        return item.id === service.id ? payload : item;
      });
      showToast('Đã cập nhật dịch vụ');
    } else {
      groomingData.services.push(payload);
      showToast('Đã thêm dịch vụ');
    }
    persistGroomingData();
    renderServicesTable(groomingData.services, groomingData.groomers, groomingData.schedules);
    bindServiceActions();
  }, service || {});
}

function openGroomerModal(groomer) {
  var fields = [
    { name: 'name', label: 'Tên groomer', type: 'text', required: true, value: groomer ? groomer.name : '' },
    { name: 'phone', label: 'Số điện thoại', type: 'text', value: groomer ? groomer.phone : '' },
    { name: 'rating', label: 'Đánh giá', type: 'number', value: groomer ? groomer.rating : 4.8, step: '0.1' },
    { name: 'reviews', label: 'Số đánh giá', type: 'number', value: groomer ? groomer.reviews : 0 },
    { name: 'status', label: 'Trạng thái', type: 'select', value: groomer && groomer.status === 'offline' ? 'offline' : 'active', options: [{ value: 'active', label: 'Đang làm' }, { value: 'offline', label: 'Nghỉ' }] }
  ];

  openCrudModal(groomer ? 'Sửa groomer' : 'Thêm groomer', fields, function (values) {
    var payload = {
      id: groomer ? groomer.id : ('groomer_' + Date.now()),
      name: values.name.trim(),
      phone: values.phone.trim(),
      rating: Number(values.rating) || 0,
      reviews: Number(values.reviews) || 0,
      status: values.status,
      avatar: groomer ? groomer.avatar : '../assets/img/admin/avatar-dog.png'
    };

    if (groomer) {
      groomingData.groomers = groomingData.groomers.map(function (item) {
        return item.id === groomer.id ? payload : item;
      });
      showToast('Đã cập nhật groomer');
    } else {
      groomingData.groomers.push(payload);
      showToast('Đã thêm groomer');
    }
    persistGroomingData();
    renderGroomersTable(groomingData.groomers, groomingData.schedules);
    bindGroomerActions();
  }, groomer || {});
}

function openScheduleModal(schedule) {
  var serviceOptions = groomingData.services.map(function (item) {
    return { value: item.id, label: item.name };
  });
  var groomerOptions = groomingData.groomers.map(function (item) {
    return { value: item.id, label: item.name };
  });

  var defaultDate = schedule && schedule.date ? formatDateInput(schedule.date) : '';
  var fields = [
    { name: 'petName', label: 'Tên thú cưng', type: 'text', required: true, value: schedule ? schedule.petName : '' },
    { name: 'customerName', label: 'Tên khách hàng', type: 'text', required: true, value: schedule ? schedule.customerName : '' },
    { name: 'date', label: 'Thời gian', type: 'datetime-local', required: true, value: defaultDate },
    { name: 'serviceId', label: 'Dịch vụ', type: 'select', value: schedule ? schedule.serviceId : (serviceOptions[0] ? serviceOptions[0].value : ''), options: serviceOptions },
    { name: 'groomerId', label: 'Groomer', type: 'select', value: schedule ? schedule.groomerId : (groomerOptions[0] ? groomerOptions[0].value : ''), options: groomerOptions },
    { name: 'status', label: 'Trạng thái', type: 'select', value: schedule ? schedule.status : 'confirmed', options: [{ value: 'confirmed', label: 'Đã xác nhận' }, { value: 'pending', label: 'Chờ xác nhận' }, { value: 'cancelled', label: 'Đã hủy' }] }
  ];

  openCrudModal(schedule ? 'Sửa lịch grooming' : 'Thêm lịch grooming', fields, function (values) {
    var payload = {
      id: schedule ? schedule.id : ('schedule_' + Date.now()),
      petName: values.petName.trim(),
      customerName: values.customerName.trim(),
      date: values.date,
      serviceId: values.serviceId,
      groomerId: values.groomerId,
      status: values.status
    };

    if (schedule) {
      groomingData.schedules = groomingData.schedules.map(function (item) {
        return item.id === schedule.id ? payload : item;
      });
      showToast('Đã cập nhật lịch grooming');
    } else {
      groomingData.schedules.push(payload);
      showToast('Đã thêm lịch grooming');
    }
    persistGroomingData();
    renderScheduleTable(groomingData.schedules, groomingData.services, groomingData.groomers);
    bindScheduleActions();
  }, schedule || {});
}

function formatDateInput(value) {
  if (!value) return '';
  var date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  var pad = function (num) {
    return String(num).padStart(2, '0');
  };
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

function getServiceDuration(service) {
  if (service.duration) return service.duration;
  if (service.category === 'spa') return '45 phút';
  if (service.category === 'addon') return '20 phút';
  return '30 phút';
}

function getServiceName(serviceId, services) {
  var service = services.find(function (item) {
    return item.id === serviceId;
  });
  return service ? service.name : 'Dịch vụ';
}

function getGroomerName(groomerId, groomers) {
  var groomer = groomers.find(function (item) {
    return item.id === groomerId;
  });
  return groomer ? groomer.name : 'Chưa phân công';
}

function formatDateTime(value) {
  if (!value) return '';
  var date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function setText(id, value) {
  var el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}
