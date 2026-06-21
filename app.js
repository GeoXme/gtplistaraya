// Helper function to generate UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Helper function to format money
function formatMoney(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

// Convert numbers to Spanish text
function numeroALetras(num) {
    const Unidades = (n) => {
        switch (n) {
            case 1: return 'UN';
            case 2: return 'DOS';
            case 3: return 'TRES';
            case 4: return 'CUATRO';
            case 5: return 'CINCO';
            case 6: return 'SEIS';
            case 7: return 'SIETE';
            case 8: return 'OCHO';
            case 9: return 'NUEVE';
        }
        return '';
    };

    const Decenas = (n) => {
        let de = Math.floor(n / 10);
        let un = n % 10;
        switch (de) {
            case 1:
                switch (un) {
                    case 0: return 'DIEZ';
                    case 1: return 'ONCE';
                    case 2: return 'DOCE';
                    case 3: return 'TRECE';
                    case 4: return 'CATORCE';
                    case 5: return 'QUINCE';
                    default: return 'DIECI' + Unidades(un);
                }
            case 2:
                if (un === 0) return 'VEINTE';
                return 'VEINTI' + Unidades(un);
            case 3: return DecenasY('TREINTA', un);
            case 4: return DecenasY('CUARENTA', un);
            case 5: return DecenasY('CINCUENTA', un);
            case 6: return DecenasY('SESENTA', un);
            case 7: return DecenasY('SETENTA', un);
            case 8: return DecenasY('OCHENTA', un);
            case 9: return DecenasY('NOVENTA', un);
            case 0: return Unidades(un);
        }
    };

    const DecenasY = (strSin, numUnidad) => {
        if (numUnidad > 0) return strSin + ' Y ' + Unidades(numUnidad);
        return strSin;
    };

    const Centenas = (n) => {
        let ce = Math.floor(n / 100);
        let de = n % 100;
        switch (ce) {
            case 1:
                if (de > 0) return 'CIENTO ' + Decenas(de);
                return 'CIEN';
            case 2: return 'DOSCIENTOS ' + Decenas(de);
            case 3: return 'TRESCIENTOS ' + Decenas(de);
            case 4: return 'CUATROCIENTOS ' + Decenas(de);
            case 5: return 'QUINIENTOS ' + Decenas(de);
            case 6: return 'SEISCIENTOS ' + Decenas(de);
            case 7: return 'SETECIENTOS ' + Decenas(de);
            case 8: return 'OCHOCIENTOS ' + Decenas(de);
            case 9: return 'NOVECIENTOS ' + Decenas(de);
            case 0: return Decenas(de);
        }
    };

    const Seccion = (n, divisor, strSingular, strPlural) => {
        let cientos = Math.floor(n / divisor);
        let letras = '';
        if (cientos > 0) {
            if (cientos > 1) letras = Centenas(cientos) + ' ' + strPlural;
            else letras = strSingular;
        } else {
            letras = Centenas(cientos);
        }
        return letras;
    };

    const Miles = (n) => {
        let divisor = 1000;
        let cientos = Math.floor(n / divisor);
        let resto = n % divisor;
        let strMiles = Seccion(n, divisor, 'UN MIL', 'MIL');
        let strCentenas = Centenas(resto);
        if (strMiles === '') return strCentenas;
        return strMiles + ' ' + strCentenas;
    };

    const Millones = (n) => {
        let divisor = 1000000;
        let cientos = Math.floor(n / divisor);
        let resto = n % divisor;
        let strMillones = Seccion(n, divisor, 'UN MILLON', 'MILLONES');
        let strMiles = Miles(resto);
        if (strMillones === '') return strMiles;
        return strMillones + ' ' + strMiles;
    };

    let enteros = Math.floor(num);
    let centavos = Math.round((num - enteros) * 100);
    let letrasCentavos = centavos > 0 ? `CON ${centavos}/100 M.N.` : '00/100 M.N.';

    if (enteros === 0) return 'CERO PESOS ' + letrasCentavos;
    if (enteros === 1) return 'UN PESO ' + letrasCentavos;
    return Millones(enteros) + ' PESOS ' + letrasCentavos;
}

// Convert date YYYY-MM-DD to DD-MM-YYYY
function formatDateDMY(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Calculate Period: Start Date (8 days before) and End Date
function calculatePeriod(fechaPagoStr) {
    if (!fechaPagoStr) return '';
    const date = new Date(fechaPagoStr + 'T00:00:00');
    const endDateStr = formatDateDMY(fechaPagoStr);

    // Subtract 7 days
    date.setDate(date.getDate() - 7);

    const startYear = date.getFullYear();
    const startMonth = String(date.getMonth() + 1).padStart(2, '0');
    const startDay = String(date.getDate()).padStart(2, '0');
    const startDateStr = `${startDay}-${startMonth}-${startYear}`;

    return `${startDateStr} - ${endDateStr}`;
}

// Local Database State
const DB = {
    getCompany: async function() {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('company')
                    .select('*')
                    .eq('id', 1)
                    .single();
                if (error) {
                    if (error.code === 'PGRST116') {
                        return this.getLocalCompany();
                    }
                    throw error;
                }
                return {
                    name: data.name,
                    businessName: data.business_name,
                    address: data.address,
                    rfc: data.rfc,
                    employerRegistry: data.employer_registry,
                    regime: data.regime,
                    logo: data.logo || ""
                };
            } catch (err) {
                console.error("Error fetching company from Supabase:", err);
                return this.getLocalCompany();
            }
        }
        return this.getLocalCompany();
    },
    getLocalCompany: function() {
        const defaultCompany = {
            name: "MI EMPRESA S.A. DE C.V.",
            businessName: "MI EMPRESA RAZON SOCIAL",
            address: "AV. CONSTITUCIÓN 123, COL. CENTRO, MONTERREY, N.L.",
            rfc: "DEMO010101AAA",
            employerRegistry: "Y1234567890",
            regime: "601 - General de Ley Personas Morales",
            logo: ""
        };
        const saved = localStorage.getItem('cfdi_company');
        return saved ? JSON.parse(saved) : defaultCompany;
    },
    saveCompany: async function(company) {
        this.saveLocalCompany(company); // Backup locally
        if (supabaseClient) {
            try {
                const { error } = await supabaseClient
                    .from('company')
                    .upsert({
                        id: 1,
                        name: company.name,
                        business_name: company.businessName,
                        address: company.address,
                        rfc: company.rfc,
                        employer_registry: company.employerRegistry,
                        regime: company.regime,
                        logo: company.logo
                    });
                if (error) throw error;
            } catch (err) {
                console.error("Error saving company to Supabase:", err);
                showToast("Error Supabase", "No se pudieron subir los datos de la empresa.", "danger");
            }
        }
    },
    saveLocalCompany: function(company) {
        localStorage.setItem('cfdi_company', JSON.stringify(company));
    },
    getEmployees: async function() {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('employees')
                    .select('*')
                    .order('no', { ascending: true });
                if (error) throw error;
                return data.map(emp => ({
                    no: emp.no,
                    control: emp.control,
                    name: emp.name,
                    curp: emp.curp,
                    rfc: emp.rfc,
                    imss: emp.imss,
                    depto: emp.depto,
                    puesto: emp.puesto,
                    ingreso: emp.ingreso,
                    sueldo: Number(emp.sueldo),
                    sDiario: Number(emp.s_diario),
                    status: emp.status
                }));
            } catch (err) {
                console.error("Error fetching employees from Supabase:", err);
                return this.getLocalEmployees();
            }
        }
        return this.getLocalEmployees();
    },
    getLocalEmployees: function() {
        const saved = localStorage.getItem('cfdi_employees');
        return saved ? JSON.parse(saved) : [];
    },
    saveEmployees: async function(employees) {
        this.saveLocalEmployees(employees); // Backup locally
        if (supabaseClient) {
            try {
                const mapped = employees.map(emp => ({
                    no: emp.no,
                    control: emp.control,
                    name: emp.name,
                    curp: emp.curp,
                    rfc: emp.rfc,
                    imss: emp.imss,
                    depto: emp.depto,
                    puesto: emp.puesto,
                    ingreso: emp.ingreso,
                    sueldo: emp.sueldo,
                    s_diario: emp.sDiario,
                    status: emp.status
                }));
                const { error } = await supabaseClient
                    .from('employees')
                    .upsert(mapped);
                if (error) throw error;
            } catch (err) {
                console.error("Error saving employees to Supabase:", err);
                showToast("Error Supabase", "No se pudieron sincronizar los empleados.", "danger");
            }
        }
    },
    saveLocalEmployees: function(employees) {
        localStorage.setItem('cfdi_employees', JSON.stringify(employees));
    },
    getPayrolls: async function() {
        if (supabaseClient) {
            try {
                const { data: batches, error: batchErr } = await supabaseClient
                    .from('payrolls')
                    .select('*')
                    .order('created_at', { ascending: true });
                if (batchErr) throw batchErr;

                const { data: items, error: itemsErr } = await supabaseClient
                    .from('payroll_items')
                    .select('*');
                if (itemsErr) throw itemsErr;

                return batches.map(b => {
                    const bItems = items.filter(item => item.payroll_id === b.id).map(item => ({
                        no: item.no,
                        control: item.control,
                        name: item.name,
                        rfc: item.rfc,
                        curp: item.curp,
                        imss: item.imss,
                        depto: item.depto,
                        puesto: item.puesto,
                        ingreso: item.ingreso,
                        diasTrab: Number(item.dias_trab),
                        sueldo: Number(item.sueldo),
                        sDiario: Number(item.s_diario),
                        pago: Number(item.pago),
                        fechaPago: item.fecha_pago,
                        periodo: item.periodo,
                        folioCFDI: item.folio_cfdi
                    }));
                    return {
                        id: b.id,
                        fechaPago: b.fecha_pago,
                        periodo: b.periodo,
                        createdAt: b.created_at,
                        items: bItems
                    };
                });
            } catch (err) {
                console.error("Error fetching payrolls from Supabase:", err);
                return this.getLocalPayrolls();
            }
        }
        return this.getLocalPayrolls();
    },
    getLocalPayrolls: function() {
        const saved = localStorage.getItem('cfdi_payrolls');
        return saved ? JSON.parse(saved) : [];
    },
    savePayrolls: async function(payrolls) {
        this.saveLocalPayrolls(payrolls); // Backup locally
        if (supabaseClient) {
            try {
                for (const batch of payrolls) {
                    const { error: pErr } = await supabaseClient
                        .from('payrolls')
                        .upsert({
                            id: batch.id,
                            fecha_pago: batch.fechaPago,
                            periodo: batch.periodo,
                            created_at: batch.createdAt
                        });
                    if (pErr) throw pErr;

                    const mappedItems = batch.items.map(item => ({
                        payroll_id: batch.id,
                        no: item.no,
                        control: item.control,
                        name: item.name,
                        rfc: item.rfc,
                        curp: item.curp,
                        imss: item.imss,
                        depto: item.depto,
                        puesto: item.puesto,
                        ingreso: item.ingreso,
                        dias_trab: item.diasTrab,
                        sueldo: item.sueldo,
                        s_diario: item.sDiario,
                        pago: item.pago,
                        fecha_pago: item.fechaPago,
                        periodo: item.periodo,
                        folio_cfdi: item.folioCFDI
                    }));

                    const { error: itemErr } = await supabaseClient
                        .from('payroll_items')
                        .upsert(mappedItems, { onConflict: 'folio_cfdi' });
                    if (itemErr) throw itemErr;
                }
            } catch (err) {
                console.error("Error saving payrolls to Supabase:", err);
                showToast("Error Supabase", "No se pudieron sincronizar los recibos de nómina.", "danger");
            }
        }
    },
    saveLocalPayrolls: function(payrolls) {
        localStorage.setItem('cfdi_payrolls', JSON.stringify(payrolls));
    }
};

// State Manager
let supabaseClient = null;
let currentEmployees = [];
let currentCompany = {};
let currentPayrolls = [];
let activePayrollList = []; // payroll list currently loaded in screen 2

// UI Toast Notification
function showToast(title, desc, type = 'success') {
    const toast = document.getElementById('toast-notification');
    toast.className = `alert-toast ${type}`;
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-desc').textContent = desc;

    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 4000);
}

// Render Company Details in Header
function renderCompanyHeader() {
    // Uses currentCompany global cache
    document.getElementById('display-company-name').textContent = currentCompany.name;
    document.getElementById('display-business-name').textContent = currentCompany.businessName;
    document.getElementById('display-address').textContent = currentCompany.address;
    document.getElementById('display-rfc').textContent = currentCompany.rfc;
    document.getElementById('display-regpat').textContent = currentCompany.employerRegistry;
    document.getElementById('display-regime').textContent = currentCompany.regime;

    // Bind Company Logo
    const logoContainer = document.getElementById('logo-container');
    const logoImg = document.getElementById('company-logo-img');
    if (currentCompany.logo) {
        logoImg.src = currentCompany.logo;
        logoContainer.style.display = 'block';
    } else {
        logoImg.src = '';
        logoContainer.style.display = 'none';
    }
}

// Navigation router
function initRouter() {
    const tabs = document.querySelectorAll('.nav-tab');
    const views = document.querySelectorAll('.page-view');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetViewId = tab.dataset.view;

            tabs.forEach(t => t.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(targetViewId).classList.add('active');

            // Clean hash URL to avoid loop unless search URL param is active
            if (history.pushState) {
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                // keep query params if we want, but remove tab hash
            }
        });
    });
}

// --- PAGE 1: EMPRESA Y EMPLEADOS CRUD ---
let editingEmployeeId = null; // null means adding new

function initEmployeeCRUD() {
    renderEmployeesTable(currentEmployees);

    // Edit Company modal opening
    document.getElementById('btn-edit-company').addEventListener('click', () => {
        const company = currentCompany;
        document.getElementById('comp-name').value = company.name;
        document.getElementById('comp-business').value = company.businessName;
        document.getElementById('comp-address').value = company.address;
        document.getElementById('comp-rfc').value = company.rfc;
        document.getElementById('comp-regpat').value = company.employerRegistry;
        document.getElementById('comp-regime').value = company.regime;

        openModal('modal-company');
    });

    // Save Company Button
    document.getElementById('form-company').addEventListener('submit', (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('comp-logo');
        const saveCompanyData = async (logoBase64) => {
            const current = currentCompany;
            const updated = {
                name: document.getElementById('comp-name').value.trim().toUpperCase(),
                businessName: document.getElementById('comp-business').value.trim().toUpperCase(),
                address: document.getElementById('comp-address').value.trim().toUpperCase(),
                rfc: document.getElementById('comp-rfc').value.trim().toUpperCase(),
                employerRegistry: document.getElementById('comp-regpat').value.trim().toUpperCase(),
                regime: document.getElementById('comp-regime').value.trim(),
                logo: logoBase64 !== undefined ? logoBase64 : current.logo
            };

            await DB.saveCompany(updated);
            currentCompany = updated;
            renderCompanyHeader();
            closeModal('modal-company');
            showToast("Empresa Guardada", "Los datos de la empresa se actualizaron correctamente.");
            // Reset file input
            if (fileInput) fileInput.value = '';
        };

        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (evt) {
                saveCompanyData(evt.target.result);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            saveCompanyData(undefined); // keeps current logo
        }
    });

    // Add Employee modal opening
    document.getElementById('btn-add-employee').addEventListener('click', () => {
        editingEmployeeId = null;
        document.getElementById('modal-employee-title').textContent = "Agregar Empleado";
        document.getElementById('form-employee').reset();

        // Auto-increment No field preview
        const maxNo = currentEmployees.reduce((max, emp) => emp.no > max ? emp.no : max, 0);
        document.getElementById('emp-no').value = maxNo + 1;

        // Default Fecha de Ingreso to today
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        document.getElementById('emp-ingreso').value = `${y}-${m}-${d}`;

        document.getElementById('emp-status').checked = true;

        openModal('modal-employee');
    });

    // Employee Form Submission
    document.getElementById('form-employee').addEventListener('submit', async (e) => {
        e.preventDefault();

        const control = parseInt(document.getElementById('emp-control').value);
        const name = document.getElementById('emp-name').value.trim().toUpperCase();
        const curp = document.getElementById('emp-curp').value.trim().toUpperCase();
        const rfc = document.getElementById('emp-rfc').value.trim().toUpperCase();
        const imss = document.getElementById('emp-imss').value.trim();
        const depto = document.getElementById('emp-depto').value.trim().toUpperCase();
        const puesto = document.getElementById('emp-puesto').value.trim().toUpperCase();
        const ingreso = document.getElementById('emp-ingreso').value;
        const sueldo = parseFloat(document.getElementById('emp-sueldo').value);
        const status = document.getElementById('emp-status').checked;

        // Validations
        if (curp.length > 18) {
            alert("El CURP no puede exceder los 18 caracteres.");
            return;
        }
        if (rfc.length > 13) {
            alert("El RFC no puede exceder los 13 caracteres.");
            return;
        }
        if (imss.length > 11) {
            alert("El IMSS no puede exceder los 11 caracteres.");
            return;
        }

        const sDiario = parseFloat((sueldo / 7).toFixed(2));

        if (editingEmployeeId === null) {
            // Create
            const maxNo = currentEmployees.reduce((max, emp) => emp.no > max ? emp.no : max, 0);
            const newEmp = {
                no: maxNo + 1,
                control,
                name,
                curp,
                rfc,
                imss,
                depto,
                puesto,
                ingreso,
                sueldo,
                sDiario,
                status
            };
            currentEmployees.push(newEmp);
            showToast("Empleado Agregado", `Se registró a ${name} con éxito.`);
        } else {
            // Update
            const idx = currentEmployees.findIndex(emp => emp.no === editingEmployeeId);
            if (idx !== -1) {
                currentEmployees[idx] = {
                    ...currentEmployees[idx],
                    control,
                    name,
                    curp,
                    rfc,
                    imss,
                    depto,
                    puesto,
                    ingreso,
                    sueldo,
                    sDiario,
                    status
                };
                showToast("Empleado Modificado", `Se actualizaron los datos de ${name}.`);
            }
        }

        await DB.saveEmployees(currentEmployees);
        renderEmployeesTable(currentEmployees);
        closeModal('modal-employee');
    });

    // Employee Search Filter
    document.getElementById('search-employee').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = currentEmployees.filter(emp =>
            emp.name.toLowerCase().includes(query) ||
            emp.rfc.toLowerCase().includes(query) ||
            emp.curp.toLowerCase().includes(query) ||
            emp.puesto.toLowerCase().includes(query) ||
            emp.depto.toLowerCase().includes(query) ||
            emp.control.toString().includes(query)
        );
        renderEmployeesTable(filtered);
    });

    // Excel Export
    document.getElementById('btn-export-excel').addEventListener('click', () => {
        if (currentEmployees.length === 0) {
            showToast("Exportar", "No hay empleados registrados para exportar.", "danger");
            return;
        }

        // Map data to user friendly columns
        const exportData = currentEmployees.map(emp => ({
            'No. Registro': emp.no,
            'No. Control': emp.control,
            'Nombre Completo': emp.name,
            'CURP': emp.curp,
            'RFC': emp.rfc,
            'NSS / IMSS': emp.imss,
            'Departamento': emp.depto,
            'Puesto': emp.puesto,
            'Fecha de Ingreso': emp.ingreso,
            'Sueldo Semanal': emp.sueldo,
            'Sueldo Diario': emp.sDiario,
            'Estatus (1=Activo, 0=Inactivo)': emp.status ? 1 : 0
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Catálogo Empleados");

        // Adjust column widths automatically
        const max_val = exportData.reduce((w, r) => Math.max(w, Object.values(r).reduce((subW, val) => Math.max(subW, val.toString().length), 0)), 15);
        worksheet['!cols'] = Object.keys(exportData[0]).map(() => ({ wch: max_val }));

        XLSX.writeFile(workbook, "catalogo_empleados.xlsx");
        showToast("Excel Exportado", "Se generó y descargó el archivo catalogo_empleados.xlsx.");
    });

    // Excel Import
    document.getElementById('import-excel-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function (evt) {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (jsonData.length === 0) {
                    showToast("Error Importación", "El archivo Excel está vacío.", "danger");
                    return;
                }

                let importedCount = 0;
                let errorCount = 0;

                let maxNo = currentEmployees.reduce((max, emp) => emp.no > max ? emp.no : max, 0);

                // Helper to normalize Excel dates
                function parseExcelDate(val) {
                    if (!val) {
                        const todayObj = new Date();
                        const y = todayObj.getFullYear();
                        const m = String(todayObj.getMonth() + 1).padStart(2, '0');
                        const d = String(todayObj.getDate()).padStart(2, '0');
                        return `${y}-${m}-${d}`;
                    }
                    if (!isNaN(val) && typeof val === 'number') {
                        const date = new Date((val - 25569) * 86400 * 1000);
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const d = String(date.getDate()).padStart(2, '0');
                        return `${y}-${m}-${d}`;
                    }
                    const str = val.toString().trim();
                    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        return str;
                    }
                    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                    if (dmyMatch) {
                        return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
                    }
                    const parsed = Date.parse(str);
                    if (!isNaN(parsed)) {
                        const date = new Date(parsed);
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const d = String(date.getDate()).padStart(2, '0');
                        return `${y}-${m}-${d}`;
                    }
                    const todayObj = new Date();
                    const y = todayObj.getFullYear();
                    const m = String(todayObj.getMonth() + 1).padStart(2, '0');
                    const d = String(todayObj.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                }

                jsonData.forEach((row) => {
                    // Try to map various column name aliases
                    const control = parseInt(row['No. Control'] || row['Control'] || row['control'] || 0);
                    const name = (row['Nombre Completo'] || row['Nombre'] || row['nombre'] || '').toString().trim().toUpperCase();
                    const curp = (row['CURP'] || row['curp'] || '').toString().trim().toUpperCase();
                    const rfc = (row['RFC'] || row['rfc'] || '').toString().trim().toUpperCase();
                    const imss = (row['NSS / IMSS'] || row['IMSS'] || row['imss'] || row['NSS'] || row['nss'] || '').toString().trim();
                    const depto = (row['Departamento'] || row['Depto'] || row['depto'] || '').toString().trim().toUpperCase();
                    const puesto = (row['Puesto'] || row['puesto'] || '').toString().trim().toUpperCase();
                    const ingresoRaw = row['Fecha de Ingreso'] || row['Fecha Ingreso'] || row['Ingreso'] || row['ingreso'] || '';
                    const ingreso = parseExcelDate(ingresoRaw);
                    const sueldo = parseFloat(row['Sueldo Semanal'] || row['Sueldo'] || row['sueldo'] || 0);

                    let statusRaw = row['Estatus (1=Activo, 0=Inactivo)'] !== undefined ? row['Estatus (1=Activo, 0=Inactivo)'] : (row['Estatus'] || row['estatus'] || 1);
                    const status = (statusRaw === 1 || statusRaw === true || statusRaw.toString().toLowerCase() === 'activo' || statusRaw.toString().toLowerCase() === 'true');

                    if (name && curp.length <= 18 && rfc.length <= 13 && imss.length <= 11 && sueldo > 0) {
                        maxNo++;
                        const sDiario = parseFloat((sueldo / 7).toFixed(2));

                        // Check if RFC or CURP already exists to update instead of duplicate
                        const existingIdx = currentEmployees.findIndex(emp => emp.rfc === rfc || emp.curp === curp);

                        const empObj = {
                            no: existingIdx !== -1 ? currentEmployees[existingIdx].no : maxNo,
                            control: control || maxNo * 10,
                            name,
                            curp,
                            rfc,
                            imss,
                            depto,
                            puesto,
                            ingreso,
                            sueldo,
                            sDiario,
                            status
                        };

                        if (existingIdx !== -1) {
                            currentEmployees[existingIdx] = empObj;
                            // revert maxNo since we reused ID
                            maxNo--;
                        } else {
                            currentEmployees.push(empObj);
                        }
                        importedCount++;
                    } else {
                        errorCount++;
                    }
                });

                await DB.saveEmployees(currentEmployees);
                renderEmployeesTable(currentEmployees);
                showToast("Importación Completa", `Se importaron/actualizaron ${importedCount} trabajadores. Fila(s) ignorada(s) por datos inválidos: ${errorCount}.`);

                // Clear input
                e.target.value = '';
            } catch (err) {
                console.error(err);
                showToast("Error Importación", "No se pudo leer el archivo Excel. Asegúrate que tenga el formato correcto.", "danger");
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

function renderEmployeesTable(employeesList) {
    const tbody = document.querySelector('#employees-table tbody');
    tbody.innerHTML = '';

    if (employeesList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted">No se encontraron empleados registrados.</td></tr>`;
        return;
    }

    employeesList.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${emp.no}</strong></td>
            <td>${emp.control}</td>
            <td>${emp.name}</td>
            <td><code>${emp.curp}</code></td>
            <td><code>${emp.rfc}</code></td>
            <td>${emp.imss}</td>
            <td>${emp.depto}</td>
            <td>${emp.puesto}</td>
            <td><code class="text-muted">${formatDateDMY(emp.ingreso)}</code></td>
            <td>${formatMoney(emp.sueldo)}</td>
            <td>${formatMoney(emp.sDiario)}</td>
            <td>
                <span class="badge ${emp.status ? 'badge-success' : 'badge-danger'}">
                    ${emp.status ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-secondary btn-sm" onclick="editEmployee(${emp.no})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEmployee(${emp.no})">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Global functions for inline actions in table
window.editEmployee = function (no) {
    const emp = currentEmployees.find(e => e.no === no);
    if (!emp) return;

    editingEmployeeId = no;
    document.getElementById('modal-employee-title').textContent = "Editar Empleado";

    document.getElementById('emp-no').value = emp.no;
    document.getElementById('emp-control').value = emp.control;
    document.getElementById('emp-name').value = emp.name;
    document.getElementById('emp-curp').value = emp.curp;
    document.getElementById('emp-rfc').value = emp.rfc;
    document.getElementById('emp-imss').value = emp.imss;
    document.getElementById('emp-depto').value = emp.depto;
    document.getElementById('emp-puesto').value = emp.puesto;
    document.getElementById('emp-ingreso').value = emp.ingreso || '';
    document.getElementById('emp-sueldo').value = emp.sueldo;
    document.getElementById('emp-status').checked = emp.status;

    openModal('modal-employee');
};

window.deleteEmployee = async function (no) {
    if (confirm(`¿Estás seguro de que deseas eliminar al empleado No. ${no}?`)) {
        currentEmployees = currentEmployees.filter(emp => emp.no !== no);
        if (supabaseClient) {
            try {
                const { error } = await supabaseClient
                    .from('employees')
                    .delete()
                    .eq('no', no);
                if (error) throw error;
            } catch (err) {
                console.error("Error deleting employee from Supabase:", err);
                showToast("Error Supabase", "No se pudo eliminar el empleado de la base de datos remota.", "danger");
            }
        }
        await DB.saveEmployees(currentEmployees);
        renderEmployeesTable(currentEmployees);
        showToast("Empleado Eliminado", "El empleado ha sido removido del catálogo.", "danger");
    }
};

// --- PAGE 2: LISTA DE RAYA ---
function initPayrollPage() {
    // Set datepicker default value to today's date
    const dateInput = document.getElementById('payroll-date');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;

    // Handle "Nueva lista de raya" click
    document.getElementById('btn-new-payroll').addEventListener('click', async () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            alert("Por favor selecciona una fecha de pago.");
            return;
        }

        currentEmployees = await DB.getEmployees();
        // Filter active employees
        const activeEmployees = currentEmployees.filter(emp => emp.status === true);

        if (activeEmployees.length === 0) {
            alert("No hay trabajadores activos en el catálogo para generar la lista de raya.");
            return;
        }

        // Build activePayrollList
        const periodStr = calculatePeriod(selectedDate);
        activePayrollList = activeEmployees.map(emp => {
            return {
                no: emp.no,
                control: emp.control,
                name: emp.name,
                rfc: emp.rfc,
                puesto: emp.puesto,
                sueldo: emp.sueldo,
                sDiario: emp.sDiario,
                curp: emp.curp, // keepcurp/imss/ingreso/depto for print rendering
                imss: emp.imss,
                depto: emp.depto,
                ingreso: emp.ingreso,
                diasTrab: 7, // default to 7 days
                pago: parseFloat((emp.sDiario * 7).toFixed(2)),
                fechaPago: selectedDate,
                periodo: periodStr,
                folioCFDI: generateUUID(),
                selected: true
            };
        });

        // Set select all checkbox back to checked
        document.getElementById('payroll-select-all').checked = true;

        renderPayrollGrid();
        document.getElementById('payroll-grid-container').style.display = 'block';
        showToast("Lista Generada", `Cargados ${activePayrollList.length} trabajadores activos.`);
    });

    // Date change updates period in loaded list
    dateInput.addEventListener('change', () => {
        const newDate = dateInput.value;
        if (!newDate || activePayrollList.length === 0) return;

        const periodStr = calculatePeriod(newDate);
        activePayrollList.forEach(item => {
            item.fechaPago = newDate;
            item.periodo = periodStr;
        });

        // Re-render
        renderPayrollGrid();
    });

    // Select all checkboxes handler
    document.getElementById('payroll-select-all').addEventListener('change', (e) => {
        const checked = e.target.checked;
        activePayrollList.forEach(item => {
            item.selected = checked;
        });
        // Update all individual checkboxes in table
        const checkboxes = document.querySelectorAll('.payroll-row-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
        });
    });

    // Cancel Payroll Button
    document.getElementById('btn-cancel-payroll').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cancelar la lista de raya actual? Se perderán los cambios no guardados.')) {
            activePayrollList = [];
            document.getElementById('payroll-grid-container').style.display = 'none';
            // Also reset select-all checkbox
            document.getElementById('payroll-select-all').checked = true;
        }
    });

    // Guardar Lista de Raya Button
    document.getElementById('btn-save-payroll').addEventListener('click', async () => {
        if (activePayrollList.length === 0) {
            alert("No hay datos en la lista de raya para guardar.");
            return;
        }

        const selectedItems = activePayrollList.filter(item => item.selected);
        if (selectedItems.length === 0) {
            alert("Debe seleccionar al menos un trabajador para guardar la lista de raya.");
            return;
        }

        // Validate values only on selected items
        let invalid = false;
        selectedItems.forEach(item => {
            if (item.diasTrab < 0 || item.diasTrab > 7 || isNaN(item.diasTrab)) {
                invalid = true;
            }
        });

        if (invalid) {
            alert("Los días trabajados deben ser un número entre 0 y 7.");
            return;
        }

        // Save to DB
        currentPayrolls = await DB.getPayrolls();

        // Generate a payroll batch header
        const payrollBatch = {
            id: generateUUID(),
            fechaPago: document.getElementById('payroll-date').value,
            periodo: selectedItems[0].periodo,
            createdAt: new Date().toISOString(),
            items: JSON.parse(JSON.stringify(selectedItems)) // deep copy
        };

        activePayrollList = selectedItems;
        currentPayrolls.push(payrollBatch);
        await DB.savePayrolls(currentPayrolls);

        // Update Period dropdown on Search Page
        populatePeriodsDropdown();

        showToast("Nómina Guardada", "La lista de raya se guardó con éxito en el sistema.");

        // Update grid to show print buttons since it's now saved!
        renderPayrollGrid(true); // pass true to indicate it is saved
    });
}

function renderPayrollGrid(isSaved = false) {
    const tbody = document.querySelector('#payroll-table tbody');
    tbody.innerHTML = '';

    activePayrollList.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" class="payroll-row-checkbox" 
                    ${item.selected ? 'checked' : ''} 
                    onchange="togglePayrollRow(${index}, this.checked)" 
                    ${isSaved ? 'disabled' : ''}>
            </td>
            <td><strong>${item.no}</strong></td>
            <td>${item.control}</td>
            <td>${item.name}</td>
            <td><code>${item.rfc}</code></td>
            <td>${item.puesto}</td>
            <td>
                <input type="number" min="0" max="7" step="0.5" class="table-input" 
                    value="${item.diasTrab}" 
                    onchange="updatePayrollDays(${index}, this.value)" 
                    ${isSaved ? 'disabled' : ''}>
            </td>
            <td id="pago-cell-${index}"><strong>${formatMoney(item.pago)}</strong></td>
            <td><code class="text-muted" style="font-size: 0.8rem;">${formatDateDMY(item.fechaPago)}</code></td>
            <td><span style="font-size: 0.8rem; white-space: nowrap;">${item.periodo}</span></td>
            <td><code class="text-muted" style="font-size: 0.75rem;">${item.folioCFDI}</code></td>
            <td>
                ${isSaved ?
                `<button class="btn btn-primary btn-sm" onclick="printSingleReceipt('${item.folioCFDI}')">Imprimir Recibo</button>`
                : '<span class="text-muted" style="font-size: 0.8rem;">Guarde para imprimir</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.togglePayrollRow = function (index, checked) {
    if (activePayrollList[index]) {
        activePayrollList[index].selected = checked;
    }
    // Update select-all checkbox if state changes
    const selectAll = document.getElementById('payroll-select-all');
    if (selectAll) {
        selectAll.checked = activePayrollList.every(item => item.selected);
    }
};

window.updatePayrollDays = function (index, value) {
    let days = parseFloat(value);
    if (isNaN(days) || days < 0) days = 0;
    if (days > 7) days = 7;

    // Update state
    activePayrollList[index].diasTrab = days;
    activePayrollList[index].pago = parseFloat((activePayrollList[index].sDiario * days).toFixed(2));

    // Update Pago display cell
    const cell = document.getElementById(`pago-cell-${index}`);
    if (cell) {
        cell.innerHTML = `<strong>${formatMoney(activePayrollList[index].pago)}</strong>`;
    }
};

// --- PAGE 3: BÚSQUEDA Y CONSULTAS ---
function initSearchPage() {
    populatePeriodsDropdown();

    // 1. Search by Folio
    document.getElementById('btn-search-folio').addEventListener('click', () => {
        const folioInput = document.getElementById('search-folio-input').value.trim();
        if (!folioInput) {
            alert("Introduce un Folio CFDI (UUID) para buscar.");
            return;
        }
        performFolioSearch(folioInput);
    });

    // 2. Search by RFC
    document.getElementById('btn-search-rfc').addEventListener('click', () => {
        const rfcInput = document.getElementById('search-rfc-input').value.trim().toUpperCase();
        if (!rfcInput) {
            alert("Introduce un RFC para buscar.");
            return;
        }
        performRfcSearch(rfcInput);
    });

    // 3. Search by Period
    document.getElementById('search-period-select').addEventListener('change', (e) => {
        const periodSelected = e.target.value;
        if (!periodSelected) {
            document.getElementById('period-results-container').style.display = 'none';
            return;
        }
        performPeriodSearch(periodSelected);
    });
}

function populatePeriodsDropdown() {
    const select = document.getElementById('search-period-select');
    if (!select) return;
    // Clear everything except first option
    select.innerHTML = '<option value="">-- Selecciona un periodo --</option>';

    const periods = new Set();

    currentPayrolls.forEach(batch => {
        if (batch.periodo) {
            periods.add(batch.periodo);
        }
    });

    // Sort periods (optional, we just append)
    periods.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        select.appendChild(opt);
    });
}

// Perform search for single FolioCFDI
function performFolioSearch(folio) {
    let foundItem = null;

    for (const batch of currentPayrolls) {
        foundItem = batch.items.find(item => item.folioCFDI === folio);
        if (foundItem) break;
    }

    if (!foundItem) {
        showToast("No Encontrado", "No se encontró ningún comprobante con el Folio CFDI especificado.", "danger");
        return;
    }

    // Render inside modal
    renderFolioModalDetails(foundItem);
    openModal('modal-folio-details');
}

function renderFolioModalDetails(item) {
    const body = document.getElementById('folio-details-body');

    body.innerHTML = `
        <div class="details-modal-wrapper">
            <div class="details-modal-header-card">
                <div class="employee-avatar">👤</div>
                <div>
                    <h4 class="emp-details-name">${item.name}</h4>
                    <p class="emp-details-meta">No. Control: <strong>${item.control}</strong> | Puesto: <strong>${item.puesto}</strong> | Depto: <strong>${item.depto}</strong></p>
                </div>
            </div>

            <div class="details-modal-grid">
                <div class="details-card-section">
                    <h5 class="section-title">Datos del Trabajador</h5>
                    <div class="detail-row">
                        <span class="detail-label">RFC:</span>
                        <span class="detail-value"><code>${item.rfc}</code></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">CURP:</span>
                        <span class="detail-value"><code>${item.curp}</code></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">NSS / IMSS:</span>
                        <span class="detail-value">${item.imss}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Fecha Ingreso:</span>
                        <span class="detail-value">${formatDateDMY(item.ingreso)}</span>
                    </div>
                </div>

                <div class="details-card-section">
                    <h5 class="section-title">Detalles del Pago Semanal</h5>
                    <div class="detail-row">
                        <span class="detail-label">Sueldo Diario:</span>
                        <span class="detail-value"><strong>${formatMoney(item.sDiario)}</strong></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Días Trabajados:</span>
                        <span class="detail-value"><strong>${item.diasTrab}</strong></span>
                    </div>
                    <div class="detail-row highlight">
                        <span class="detail-label">Neto Recibido:</span>
                        <span class="detail-value"><strong>${formatMoney(item.pago)}</strong></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Fecha de Pago:</span>
                        <span class="detail-value">${formatDateDMY(item.fechaPago)}</span>
                    </div>
                </div>
            </div>

            <div class="details-period-banner">
                <strong>Periodo Semanal de Nómina:</strong> ${item.periodo}
            </div>

            <div class="details-uuid-box">
                <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem;">Folio Fiscal CFDI (UUID)</div>
                <code class="uuid-text">${item.folioCFDI}</code>
            </div>
        </div>
    `;

    // Bind Print Button in Modal
    document.getElementById('btn-print-modal-receipt').onclick = function () {
        printSingleReceipt(item.folioCFDI);
    };
}

// Perform search for RFC
function performRfcSearch(rfc) {
    const results = [];

    currentPayrolls.forEach(batch => {
        batch.items.forEach(item => {
            if (item.rfc === rfc) {
                results.push(item);
            }
        });
    });

    const container = document.getElementById('rfc-results-container');
    const tbody = document.querySelector('#rfc-results-table tbody');
    tbody.innerHTML = '';

    if (results.length === 0) {
        container.style.display = 'block';
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No se encontraron comprobantes para el RFC ${rfc}.</td></tr>`;
        // Hide print all button
        document.getElementById('btn-print-all-rfc').style.display = 'none';
        return;
    }

    container.style.display = 'block';
    document.getElementById('btn-print-all-rfc').style.display = 'inline-flex';

    results.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.control}</strong></td>
            <td>${item.name}</td>
            <td>${item.puesto}</td>
            <td><strong>${formatMoney(item.pago)}</strong></td>
            <td><code>${formatDateDMY(item.fechaPago)}</code></td>
            <td><span style="font-size: 0.8rem;">${item.periodo}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="printSingleReceipt('${item.folioCFDI}')">Imprimir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Setup Print All button handler for these results
    document.getElementById('btn-print-all-rfc').onclick = function () {
        printBatchReceipts(results);
    };
}

// Perform search for Period
function performPeriodSearch(period) {
    const results = [];

    currentPayrolls.forEach(batch => {
        if (batch.periodo === period) {
            batch.items.forEach(item => {
                results.push(item);
            });
        }
    });

    const container = document.getElementById('period-results-container');
    const tbody = document.querySelector('#period-results-table tbody');
    tbody.innerHTML = '';

    if (results.length === 0) {
        container.style.display = 'block';
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No se encontraron comprobantes para el periodo ${period}.</td></tr>`;
        document.getElementById('btn-print-all-period').style.display = 'none';
        return;
    }

    container.style.display = 'block';
    document.getElementById('btn-print-all-period').style.display = 'inline-flex';

    results.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.control}</strong></td>
            <td>${item.name}</td>
            <td>${item.puesto}</td>
            <td><strong>${formatMoney(item.pago)}</strong></td>
            <td><code>${formatDateDMY(item.fechaPago)}</code></td>
            <td><span style="font-size: 0.8rem;">${item.periodo}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="printSingleReceipt('${item.folioCFDI}')">Imprimir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Setup Print All button handler
    document.getElementById('btn-print-all-period').onclick = function () {
        printBatchReceipts(results);
    };
}

// --- RECIBO DE NÓMINA (ASPEL NOI STYLE) RENDER & PRINT ---

// Renders the receipt HTML template to an element
function renderReceiptHTML(item, containerId) {
    const company = currentCompany;
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Create unique ID for QR canvas
    const qrCanvasId = `qr-${item.folioCFDI}-${containerId}`;

    // Prepare values
    const sDiarioFormatted = formatMoney(item.sDiario);
    const sueldoFormatted = formatMoney(item.sueldo);
    const pagoFormatted = formatMoney(item.pago);
    const textAmount = numeroALetras(item.pago);

    const receiptDiv = document.createElement('div');
    receiptDiv.className = 'noi-receipt';

    // Exact format adapted from recibonom.html (with dynamic values)
    receiptDiv.innerHTML = `
        <!-- Header -->
        <div class="header-section">
            <div style="margin-bottom: 15px;">
                <div class="company-name-header">${company.businessName}</div>
                <div class="company-name-header">  </div>
            </div>
            <div class="header-wrapper">
                <div class="company-info">
                    <div class="company-details" style="display: flex; gap: 15px; align-items: center;">
                        <div>
                            <div class="company-line">CALLE 23 PONIENTE 214, SANTA MARIA COAPAN</div>
                            <div class="company-line">TEHUACAN, PUEBLA, MEXICO, C.P. 75857</div>
                            <div class="company-line">RFC: ${company.rfc}</div>
                            <div class="company-line">Registro Patronal: ${company.employerRegistry}</div>
                            <div class="company-line">Régimen Fiscal: ${company.regime}</div>
                        </div>
                    </div>
                </div>
                <div class="receipt-box">
                    <div class="receipt-title">Recibo de Nómina</div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="content-wrapper">
            <!-- Datos del Trabajador -->
            <h4 class="section-title" style="margin-top: 5px;">Datos del Trabajador</h4>
            <div class="employee-box">
                <div class="employee-grid">
                    <div class="emp-field">
                        <div class="emp-label">No Trabajador</div>
                        <div class="emp-value">${item.control}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">Depto</div>
                        <div class="emp-value">${item.depto || '—'}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">Nombre de Trabajador</div>
                        <div class="emp-value">${item.name}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">Puesto</div>
                        <div class="emp-value">${item.puesto}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">CURP</div>
                        <div class="emp-value">${item.curp}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">Fecha de Ingreso</div>
                        <div class="emp-value">${formatDateDMY(item.ingreso) || '—'}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">RFC</div>
                        <div class="emp-value">${item.rfc}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">Período de Pago</div>
                        <div class="emp-value">${item.periodo}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">R. IMSS</div>
                        <div class="emp-value">${item.imss || '—'}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">Fecha del Comprobante</div>
                        <div class="emp-value">${formatDateDMY(item.fechaPago)}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">Régimen Trabajador</div>
                        <div class="emp-value">Sueldos/Salarios</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">Días Trabajados</div>
                        <div class="emp-value">${item.diasTrab}</div>
                    </div>
                    <div class="emp-field">
                        <div class="emp-label">Faltas</div>
                        <div class="emp-value">${Math.max(0, 7 - item.diasTrab)}</div>
                    </div>
                </div>
            </div>

            <!-- Percepciones y Deducciones -->
            <div class="totals-wrapper">
                <div class="perception-grid">
                    <h4 class="section-title">Percepciones</h4>
                    <div class="perc-line">
                        <div class="perc-label">Sueldo Semanal</div>
                        <div class="perc-value">${sueldoFormatted}</div>
                    </div>
                    <div class="perc-line">
                        <div class="perc-label">Sueldo Diario</div>
                        <div class="perc-value">${sDiarioFormatted}</div>
                    </div>
                    <div class="perc-line" style="border-top: 1px transparent; #ffffffff; padding-top: 6px; margin-top: 4px;">
                        <div class="perc-label">Total en Efectivo</div>
                        <div class="perc-value">${pagoFormatted}</div>
                    </div>
                </div>
                <div class="deduction-grid">
                    <h4 class="section-title">Deducciones</h4>
                    <div class="perc-line">
                        <div class="dedu-label">Cuota IMSS</div>
                        <div class="dedu-value">$--</div>
                    </div>
                    <div class="perc-line">
                        <div class="dedu-label">ISR</div>
                        <div class="dedu-value">$--</div>
                    </div>
                </div>
            </div>

            <!-- Neto a Pagar -->
            <div style="border: 2px solid transparent; padding: 10px; margin: 2px 0;">
                <div class="total-line">
                </div>
                </div>
            </div>

            <!-- Firma del Trabajador -->
            <div style="margin: 15px 0; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="width: 45%; display: flex; flex-direction: column; align-items: center;">
                </div>
                <div style="width: 45%; display: flex; flex-direction: column; align-items: center;">
                    <div style="font-size: 8px; font-weight: bold; color: #002560; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.2px;">Firma del Trabajador</div>
                    <div style="border-bottom: 1px solid #000; height: 35px; width: 100%; margin-bottom: 2px;"></div>
                </div>
            </div>

            <!-- CFDI Section -->
            <h4 class="section-title">Comprobante Fiscal Digital por Internet</h4>
            <div style="display: flex; gap: 15px; margin: 8px 0; align-items: flex-start;">
                <!-- QR Box Left -->
                <div class="qr-box" style="flex-shrink: 0;">
                    <canvas id="${qrCanvasId}" style="width: 200px; height: 200px;"></canvas>
                </div>
                
                <!-- SAT Details Box Right -->
                <div class="cfdi-box" style="flex: 1; padding: 10px;">
                    <div style="margin-bottom: 4px;">
                        <div class="cfdi-label">UUID CFDI</div>
                        <div class="cfdi-value" style="font-size: 7.5px; background: white; padding: 3px; border-radius: 2px; border: 1px solid #ffffffff;">${item.folioCFDI}</div>
                    </div>
                    
                    <div style="margin-bottom: 4px;">
                        <div class="cfdi-label">Sello Digital CFDI</div>
                        <div class="cfdi-value" style="font-size: 6.5px; background: white; padding: 3px; border-radius: 2px; border: 1px solid #ffffffff; max-height: 40px; overflow: hidden;">d3g8FskJmP1q9SjKlR2wT4yU5iO6pZaQ8xS7dF5gH4jK3lM2nB1vC8xZ9qW8eR7tY6uI5oP4aS3dF2gH1jK8lM5nT4yU3iO2pZaQ==</div>
                    </div>
                    
                    <div style="margin-bottom: 4px;">
                        <div class="cfdi-label">Sello del SAT</div>
                        <div class="cfdi-value" style="font-size: 6.5px; background: white; padding: 3px; border-radius: 2px; border: 1px solid #ffffffff; max-height: 40px; overflow: hidden;">mP1q9SjKlR2wT4yU5iO6pZaQ8xS7dF5gH4jK3lM2nB1vC8xZ9qW8eR7tY6uI5oP4aS3dF2gH1jK8lM5nT4yU3iO2pZaQd3g8FskJ==</div>
                    </div>
                    
                    <div>
                        <div class="cfdi-label">Cadena Original del Complemento de Certificación</div>
                        <div class="cfdi-value" style="font-size: 6.5px; background: white; padding: 3px; border-radius: 2px; border: 1px solid #ffffffff; max-height: 40px; overflow: hidden;">||1.1|${item.folioCFDI}|${item.fechaPago}T12:00:00|DEM010101AAA|d3g8FskJmP1q9SjKlR2wT4yU5iO6pZaQ8xS7dF5gH4jK3lM2nB1vC8xZ9qW8eR7tY6uI5oP4aS3dF2gH1jK8lM5nT4yU3iO2pZaQ==|00001000000502000436||</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.appendChild(receiptDiv);

    // Generate QR code on the canvas
    setTimeout(() => {
        const canvas = document.getElementById(qrCanvasId);
        if (canvas) {
            // URL format: BASE_URL + ?folio=UUID
            const searchUrl = `${window.location.origin}${window.location.pathname}?folio=${item.folioCFDI}`;
            new QRious({
                element: canvas,
                value: searchUrl,
                size: 150
            });
        }
    }, 50);
}

// Print single receipt
window.printSingleReceipt = function (folio) {
    let foundItem = null;

    for (const batch of currentPayrolls) {
        foundItem = batch.items.find(item => item.folioCFDI === folio);
        if (foundItem) break;
    }

    if (!foundItem) {
        alert("No se encontró el comprobante para imprimir.");
        return;
    }

    const printContainer = document.getElementById('print-container');
    printContainer.innerHTML = '';

    // Append receipt and trigger print
    renderReceiptHTML(foundItem, 'print-container');

    // Wait slightly for QR code canvas to render before printing
    setTimeout(() => {
        window.print();
    }, 300);
};

// Print batch list of receipts
function printBatchReceipts(itemsList) {
    if (!itemsList || itemsList.length === 0) {
        alert("No hay comprobantes para imprimir.");
        return;
    }

    const printContainer = document.getElementById('print-container');
    printContainer.innerHTML = '';

    // Append all receipts
    itemsList.forEach(item => {
        const itemWrapper = document.createElement('div');
        itemWrapper.id = `wrapper-${item.folioCFDI}`;
        printContainer.appendChild(itemWrapper);
        renderReceiptHTML(item, itemWrapper.id);
    });

    // Wait slightly for QR canvas rendering
    setTimeout(() => {
        window.print();
    }, 400);
}

// --- URL PARAMETER PROCESSING FOR DIRECT SEARCH ---
function processUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const folio = urlParams.get('folio');

    if (folio) {
        // Switch tab to Búsqueda
        const tabs = document.querySelectorAll('.nav-tab');
        const views = document.querySelectorAll('.page-view');

        tabs.forEach(t => {
            if (t.dataset.view === 'view-busqueda') {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        views.forEach(v => {
            if (v.id === 'view-busqueda') {
                v.classList.add('active');
            } else {
                v.classList.remove('active');
            }
        });

        // Set search field and perform search
        const input = document.getElementById('search-folio-input');
        if (input) {
            input.value = folio;
            // Wait slightly for DOM to settle
            setTimeout(() => {
                performFolioSearch(folio);
            }, 100);
        }
    }
}

// --- INITIALIZATION ---
async function refreshAllData() {
    currentCompany = await DB.getCompany();
    currentEmployees = await DB.getEmployees();
    currentPayrolls = await DB.getPayrolls();
}

async function initSupabaseConnection() {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
    const indicator = document.getElementById('db-status-indicator');

    if (url && key) {
        try {
            supabaseClient = supabase.createClient(url, key);
            // Test query
            const { data, error } = await supabaseClient.from('company').select('id').limit(1);
            if (error && error.code !== 'PGRST116' && error.message !== 'relation "company" does not exist') {
                throw error;
            }
            if (indicator) {
                indicator.textContent = 'EN LÍNEA';
                indicator.className = 'db-status-badge status-online';
            }
            return true;
        } catch (err) {
            console.error("Failed to connect to Supabase, falling back to local mode:", err);
            supabaseClient = null;
            if (indicator) {
                indicator.textContent = 'MODO LOCAL';
                indicator.className = 'db-status-badge status-local';
            }
            return false;
        }
    } else {
        supabaseClient = null;
        if (indicator) {
            indicator.textContent = 'MODO LOCAL';
            indicator.className = 'db-status-badge status-local';
        }
        return false;
    }
}

function initSupabaseSettings() {
    const configBtn = document.getElementById('btn-supabase-config');
    const modal = document.getElementById('modal-supabase');
    const form = document.getElementById('form-supabase');
    const urlInput = document.getElementById('sb-url');
    const keyInput = document.getElementById('sb-key');
    const statusText = document.getElementById('sb-connection-status');
    const testBtn = document.getElementById('btn-test-sb');
    const syncSection = document.getElementById('sb-sync-section');
    const syncBtn = document.getElementById('btn-sync-to-sb');
    const clearBtn = document.getElementById('btn-clear-sb');

    // Load initial values from localStorage
    const savedUrl = localStorage.getItem('supabase_url') || '';
    const savedKey = localStorage.getItem('supabase_key') || '';
    if (urlInput) urlInput.value = savedUrl;
    if (keyInput) keyInput.value = savedKey;

    function updateModalUI() {
        if (supabaseClient) {
            if (statusText) {
                statusText.textContent = "Conectado (En Línea)";
                statusText.style.color = "var(--success)";
            }
            if (syncSection) syncSection.style.display = "block";
            if (clearBtn) clearBtn.style.display = "inline-block";
        } else {
            if (statusText) {
                statusText.textContent = "Sin configurar (Modo Local)";
                statusText.style.color = "var(--text-muted)";
            }
            if (syncSection) syncSection.style.display = "none";
            if (clearBtn) clearBtn.style.display = "none";
        }
    }

    if (configBtn) {
        configBtn.addEventListener('click', () => {
            updateModalUI();
            openModal('modal-supabase');
        });
    }

    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            const key = keyInput.value.trim();

            if (!url || !key) {
                alert("Por favor introduce la URL y la Anon Key.");
                return;
            }

            testBtn.disabled = true;
            testBtn.textContent = "Probando...";
            if (statusText) {
                statusText.textContent = "Probando conexión...";
                statusText.style.color = "var(--text-muted)";
            }

            try {
                const tempClient = supabase.createClient(url, key);
                const { error } = await tempClient.from('company').select('id').limit(1);
                if (error && error.code !== 'PGRST116' && error.message !== 'relation "company" does not exist') {
                    throw error;
                }

                if (statusText) {
                    statusText.textContent = "Conexión Exitosa!";
                    statusText.style.color = "var(--success)";
                }
                showToast("Conexión Exitosa", "Se pudo establecer conexión con Supabase correctamente.");
            } catch (err) {
                console.error("Test connection error:", err);
                if (statusText) {
                    statusText.textContent = "Error de Conexión";
                    statusText.style.color = "var(--danger)";
                }
                showToast("Error de Conexión", "No se pudo conectar a Supabase. Verifica tus credenciales.", "danger");
            } finally {
                testBtn.disabled = false;
                testBtn.textContent = "Probar Conexión";
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = urlInput.value.trim();
            const key = keyInput.value.trim();

            localStorage.setItem('supabase_url', url);
            localStorage.setItem('supabase_key', key);

            const ok = await initSupabaseConnection();
            if (ok) {
                showToast("Credenciales Guardadas", "El sistema ahora opera En Línea.");
                await refreshAllData();
                renderCompanyHeader();
                renderEmployeesTable(currentEmployees);
                populatePeriodsDropdown();
            } else {
                showToast("Error al Conectar", "Se guardaron las credenciales pero falló la conexión. El sistema operará en Modo Local.", "warning");
            }
            updateModalUI();
            closeModal('modal-supabase');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (confirm("¿Estás seguro de que deseas eliminar las credenciales de Supabase? El sistema volverá a Modo Local.")) {
                localStorage.removeItem('supabase_url');
                localStorage.removeItem('supabase_key');
                if (urlInput) urlInput.value = '';
                if (keyInput) keyInput.value = '';
                
                await initSupabaseConnection();
                await refreshAllData();
                renderCompanyHeader();
                renderEmployeesTable(currentEmployees);
                populatePeriodsDropdown();
                
                updateModalUI();
                closeModal('modal-supabase');
                showToast("Credenciales Eliminadas", "El sistema ha regresado a Modo Local.");
            }
        });
    }

    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            if (!supabaseClient) {
                alert("Debes estar conectado a Supabase para realizar la migración.");
                return;
            }

            if (!confirm("Esta acción migrará tus datos de LocalStorage (Empresa, Empleados e Histórico de Nóminas) a tu base de datos remota de Supabase. Los registros con el mismo identificador serán actualizados. ¿Deseas continuar?")) {
                return;
            }

            syncBtn.disabled = true;
            syncBtn.textContent = "Migrando datos...";

            try {
                // 1. Migrate Company
                const localComp = DB.getLocalCompany();
                await DB.saveCompany(localComp);

                // 2. Migrate Employees
                const localEmps = DB.getLocalEmployees();
                if (localEmps.length > 0) {
                    await DB.saveEmployees(localEmps);
                }

                // 3. Migrate Payrolls
                const localPayrolls = DB.getLocalPayrolls();
                if (localPayrolls.length > 0) {
                    await DB.savePayrolls(localPayrolls);
                }

                showToast("Migración Completada", "Todos los datos locales se han subido con éxito a Supabase.");
                
                await refreshAllData();
                renderCompanyHeader();
                renderEmployeesTable(currentEmployees);
                populatePeriodsDropdown();

                closeModal('modal-supabase');
            } catch (err) {
                console.error("Migration error:", err);
                showToast("Error de Migración", "Hubo un error al migrar los datos a Supabase.", "danger");
            } finally {
                syncBtn.disabled = false;
                syncBtn.textContent = "📤 Migrar Datos Locales a Supabase";
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize connection
    await initSupabaseConnection();

    // 2. Refresh caches
    await refreshAllData();

    // 3. Render initial views
    renderCompanyHeader();

    // Init router and elements
    initRouter();
    initEmployeeCRUD();
    initPayrollPage();
    initSearchPage();
    initSupabaseSettings();

    processUrlParams();
});

// --- GENERAL MODAL UTILITIES ---
window.openModal = function (modalId) {
    const backdrop = document.getElementById(modalId);
    if (backdrop) {
        backdrop.classList.add('active');
    }
};

window.closeModal = function (modalId) {
    const backdrop = document.getElementById(modalId);
    if (backdrop) {
        backdrop.classList.remove('active');
    }
};
