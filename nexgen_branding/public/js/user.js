frappe.ui.form.on('User', {
    refresh: function(frm) {
        // Do not restrict the system Administrator
        if (frappe.session.user === 'Administrator') return;

        let in_settings_tab = false;
        
        // The exact labels of the sections the user WANTS to see
        const allowed_sections = ['Change Password', 'Email'];
        
        // Loop through all fields to dynamically hide unwanted sections in the Settings tab
        frm.meta.fields.forEach(df => {
            if (df.fieldtype === 'Tab Break') {
                // Check if we are currently inside the "Settings" tab
                in_settings_tab = (df.label === 'Settings');
            } else if (in_settings_tab && df.fieldtype === 'Section Break') {
                // If it's a section break inside the Settings tab, hide it unless it's allowed
                if (!allowed_sections.includes(df.label)) {
                    frm.set_df_property(df.fieldname, 'hidden', 1);
                }
            }
        });
    }
});
