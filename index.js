
const mysql = require('mysql2');
const cTable = require('console.table');
const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'staff_db'
    },
    console.log(`Connected to the staff_db database.`)
);

const inquirer = require('inquirer');
//
const promptUser = () => {
    return inquirer.prompt([
        {
            type: 'list',
            message: "Which action would you like to take?",
            name: 'selection',
            choices: [
                "View all departments",
                "View all roles",
                "View all employees",
                "Add a department",
                "Add a role",
                "Add an employee",
                "Update an employee role"
            ]
        }
    ])
    .then((data) => {
        switch (data.selection) {
            case "View all departments":
                viewAllDepartments();
                break;

            case "View all roles":
                viewAllRoles();
                break;
                
            case "View all employees":
                viewAllEmployees();
                break;
            
            case "Add a department":
                addDepartment();
                break;
        
            case "Add a role":
                addRole();
                break;
            
            case "Add an employee":
                addEmployee();
                break;
                
            case "Update an employee role":
                updateEmployeeRole();
                break;
        }
    })
};

// Initiates user prompt
promptUser();

const viewAllDepartments = () => {
    db.query(`SELECT * FROM department`, function (err, results) {
        console.log(`\n`);
        console.table(results);
        promptUser();
    })
}

const viewAllRoles = () => {
    db.query(`SELECT * FROM role`, function (err, results) {
        console.log(`\n`);
        console.table(results);
        promptUser();
    })
}

const viewAllEmployees = () => {
    db.query(`
    SELECT
    employees_with_managers.id AS employee_id,
    employees_with_managers.first_name,
    employees_with_managers.last_name,
    employee_info.title,
    employee_info.salary,
    employee_info.department_name,
    employees_with_managers.manager_name
    FROM employee_info
    JOIN employees_with_managers on employee_info.role_id = employees_with_managers.role_id;
    `, function (err, results) {
        console.log(`\n`);
        console.table(results);
        promptUser();
    })
}
const addDepartment = () => {
    return inquirer.prompt([
        {
            type: 'input',
            message: "What is the name of the new department?",
            name: 'name'
        }
    ])
    .then((data) => {
        db.query(`INSERT INTO department (name) VALUES (?)`, data.name, (err, results) => {
            console.log("\nNew department added. See below:");
            viewAllDepartments();
        })
    })
}
const addRole = () => {
    let departmentArray = [];
    db.query(`SELECT * FROM department`, function (err, results) {
        for (let i = 0; i < results.length; i++) {
            departmentArray.push(results[i].name);
        }
        return inquirer.prompt([
            {
                type: 'input',
                message: "What is the name of the new role?",
                name: 'title',
            },
            {
                type: 'input',
                message: "What is the salary of the new role?",
                name: 'salary',
            },
            {
                type: 'list',
                message: "What department is the role under?",
                name: 'department',
                choices: departmentArray
            }
        ])
        .then((data) => {
            // Get's department id
            db.query(`SELECT id FROM department WHERE department.name = ?`, data.department, (err, results) => {
                let department_id = results[0].id;
            db.query(`INSERT INTO role(title, salary, department_id)
            VALUES (?,?,?)`, [data.title, data.salary, department_id], (err, results) => {
                console.log("\nNew role added. See below:");
                viewAllRoles();
            })
            });
        })
    })
}

const addEmployee = () => {
    const roleArray= [];
    const employeeArray= [];
    // populates role array with all roles
    db.query(`SELECT * FROM role`, function (err, results) {
        for (let i = 0; i < results.length; i++) {
            roleArray.push(results[i].title);
        }
    // populates employee array with all employees
    db.query(`SELECT * FROM employee`, function (err, results) {
        for (let i = 0; i < results.length; i++) {
            let employeeName = `${results[i].first_name} ${results[i].last_name}`
            employeeArray.push(employeeName);
        }
        return inquirer.prompt([
            {
                type: 'input',
                message: "What is the employee's first name?",
                name: 'first_name',
            },
            {
                type: 'input',
                message: "What is the employee's last name?",
                name: 'last_name',
            },
            {
                type: 'list',
                message: "What is the employee's role?",
                name: 'role',
                choices: roleArray
            },
            {
                type: 'list',
                message: "Does the employee have a manager?",
                name: 'has_manager',
                choices: ["Yes", "No"]
            }
        ]).then((data) => {
            let roleName = data.role;
            let first_name = data.first_name;
            let last_name = data.last_name;
            let role_id = '';
            let manager = '';
            // populates role id
            db.query(`SELECT id FROM role WHERE role.title = ?`, data.role, (err, results) => {
                role_id = results[0].id;
            });
            if (data.has_manager === "Yes") {
                return inquirer.prompt([
                    {
                    type: 'list',
                    message: "Please select the employees manager",
                    name: 'manager',
                    choices: employeeArray
                    }   
                ]).then((data) => {
                    // get role id
                    db.query(`SELECT id FROM role WHERE role.title = ?`, roleName, (err, results) => {
                        role_id = results[0].id;
                    })
                    db.query(`SELECT id FROM employee WHERE employee.first_name = ? AND employee.last_name = ?;`, data.manager.split(" "), (err, results) => {
                        manager = results[0].id;
                        db.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) 
                        VALUES (?,?,?,?)`, [first_name, last_name, role_id, manager], (err, results) => {
                            console.log("\nNew employee added. See below:");
                            viewAllEmployees();
                        })
                    })
                })
            } else {
                // sets manager to null
                manager = null;
                // get role id
                db.query(`SELECT id FROM role WHERE role.title = ?`, roleName, (err, results) => {
                    role_id = results[0].id;
                    // query 555 still doesnt work even when manager is null
                    db.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) 
                    VALUES (?,?,?,?)`, [data.first_name, data.last_name, role_id, manager], (err, results) => {
                        console.log("\nNew employee added. See below:");
                        viewAllEmployees();
                    })
                })
            }
        })
    })
})
}


const updateEmployeeRole = () => {
    const roleArray= [];
    const employeeArray= [];
    // populates role array with all roles
    db.query(`SELECT * FROM role`, function (err, results) {
        for (let i = 0; i < results.length; i++) {
            roleArray.push(results[i].title);
        }
    // populates employee array with all employees
    db.query(`SELECT * FROM employee`, function (err, results) {
        for (let i = 0; i < results.length; i++) {
            let employeeName = `${results[i].first_name} ${results[i].last_name}`
            employeeArray.push(employeeName);
        }
        return inquirer.prompt([
            {
                type: 'list',
                message: "Which employee do you want to update?",
                name: 'employee',
                choices: employeeArray
            },
            {
                type: 'list',
                message: "What is the employee's new role?",
                name: 'role',
                choices: roleArray
            },
        ]).then((data) => {
            // get role id
            db.query(`SELECT id FROM role WHERE role.title = ?;`, data.role, (err, results) => {
                role_id = results[0].id;
                db.query(`SELECT id FROM employee WHERE employee.first_name = ? AND employee.last_name = ?;`, data.employee.split(" "), (err, results) => {
                    db.query(`UPDATE employee SET role_id = ? WHERE id = ?;`, [role_id, results[0].id], (err, results) => {
                        console.log("\nEmployee role updated. See below:");
                        viewAllEmployees();
                    })
                })

            })
        })
    })
})
}