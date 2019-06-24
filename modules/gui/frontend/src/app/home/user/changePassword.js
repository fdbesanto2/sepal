import {Constraint, Field, FieldSet, form} from 'widget/form'
import {EMPTY, throwError} from 'rxjs'
import {Input} from 'widget/input'
import {PanelContent, PanelHeader} from 'widget/panel'
import {activatable} from 'widget/activation/activatable'
import {activator} from 'widget/activation/activator'
import {changeCurrentUserPassword$} from 'widget/user'
import {compose} from 'compose'
import {msg} from 'translate'
import {switchMap} from 'rxjs/operators'
import FormPanel, {FormPanelButtons} from 'widget/formPanel'
import Notifications from 'widget/notifications'
import React from 'react'
import styles from './changePassword.module.css'

const fields = {
    oldPassword: new Field()
        .notBlank('user.changePassword.form.oldPassword.required'),
    newPassword: new Field()
        .notBlank('user.changePassword.form.newPassword.required')
        .match(/^.{8,100}$/, 'user.changePassword.form.newPassword.invalid'),
    confirmPassword: new Field()
        .notBlank('user.changePassword.form.confirmPassword.required')
}

const constraints = {
    passwordsMatch: new Constraint(['newPassword', 'confirmPassword'])
        .skip(({newPassword, confirmPassword}) => !newPassword || !confirmPassword)
        .predicate(
            ({newPassword, confirmPassword}) => !newPassword || newPassword === confirmPassword,
            'user.changePassword.form.newPassword.notMatching'
        )
}

const mapStateToProps = () => ({values: {}})

class ChangePassword extends React.Component {
    close() {
        const {activator: {activatables: {userDetails}}} = this.props
        userDetails.activate()
    }

    changePassword$(userPasswords) {
        return changeCurrentUserPassword$(userPasswords).pipe(
            switchMap(({status}) => {
                if (status === 'success') {
                    Notifications.success({message: msg('user.changePassword.success')})
                    return EMPTY
                } else {
                    this.props.inputs.oldPassword.setInvalid(msg('user.changePassword.form.oldPassword.incorrect'))
                    return throwError()
                }
            })
        )
    }

    renderForm() {
        const {inputs: {oldPassword, newPassword, confirmPassword}} = this.props
        return (
            <FieldSet>
                <Input
                    label={msg('user.changePassword.form.oldPassword.label')}
                    type='password'
                    autoFocus
                    input={oldPassword}
                    errorMessage
                />
                <Input
                    label={msg('user.changePassword.form.newPassword.label')}
                    type='password'
                    input={newPassword}
                    errorMessage
                />
                <Input
                    label={msg('user.changePassword.form.confirmPassword.label')}
                    type='password'
                    input={confirmPassword}
                    errorMessage={[confirmPassword, 'passwordsMatch']}
                />
            </FieldSet>
        )
    }

    render() {
        const {form} = this.props
        return (
            <FormPanel
                className={styles.panel}
                form={form}
                isActionForm={true}
                modal
                onApply={userPasswords => this.changePassword$(userPasswords)}
                close={() => this.close()}>
                <PanelHeader
                    iscon='key'
                    title={msg('user.changePassword.title')}/>
                <PanelContent>
                    {this.renderForm()}
                </PanelContent>
                <FormPanelButtons/>
            </FormPanel>
        )
    }
}

ChangePassword.propTypes = {}

const policy = () => ({
    _: 'disallow',
    userDetails: 'allow-then-deactivate'
})

export default compose(
    ChangePassword,
    form({fields, constraints, mapStateToProps}),
    activator('userDetails'),
    activatable({id: 'changePassword', policy, alwaysAllow: true})
)
