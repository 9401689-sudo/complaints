"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FSM_TRANSITIONS = exports.TERMINAL_STATES = exports.INITIAL_STATE = void 0;
exports.INITIAL_STATE = 'case_created';
exports.TERMINAL_STATES = ['archived'];
exports.FSM_TRANSITIONS = {
    case_created: {
        CASE_FOLDER_CREATED: 'awaiting_files',
        CASE_FOLDER_CREATE_FAILED: 'failed',
        FAIL: 'failed',
        ARCHIVE: 'archived'
    },
    awaiting_files: {
        FILES_SYNCED: 'files_synced',
        FILES_SYNC_FAILED: 'failed',
        FAIL: 'failed',
        ARCHIVE: 'archived'
    },
    files_synced: {
        FILES_SELECTED_UPDATED: 'files_selected',
        FILES_CLEARED: 'awaiting_files',
        FILES_SYNCED: 'files_synced',
        FILES_SYNC_FAILED: 'failed',
        FAIL: 'failed',
        ARCHIVE: 'archived'
    },
    files_selected: {
        INSTITUTION_SET: 'institution_selected',
        FILES_SELECTED_UPDATED: 'files_selected',
        FILES_CLEARED: 'files_synced',
        FAIL: 'failed',
        ARCHIVE: 'archived'
    },
    institution_selected: {
        TEMPLATE_SET: 'template_selected',
        FILES_SELECTED_UPDATED: 'files_selected',
        FILES_CLEARED: 'files_synced',
        INSTITUTION_SET: 'institution_selected',
        FAIL: 'failed',
        ARCHIVE: 'archived'
    },
    template_selected: {
        TEMPLATE_RENDERED: 'text_prepared',
        TEXT_SAVED: 'text_prepared',
        INSTITUTION_SET: 'institution_selected',
        TEMPLATE_SET: 'template_selected',
        TEMPLATE_RENDER_FAILED: 'failed',
        FAIL: 'failed',
        ARCHIVE: 'archived'
    },
    text_prepared: {
        PACKAGE_BUILT: 'package_ready',
        TEMPLATE_SET: 'template_selected',
        INSTITUTION_SET: 'institution_selected',
        FILES_SELECTED_UPDATED: 'files_selected',
        TEXT_INVALIDATED: 'template_selected',
        TEXT_SAVED: 'text_prepared',
        PACKAGE_BUILD_FAILED: 'failed',
        FAIL: 'failed',
        ARCHIVE: 'archived'
    },
    package_ready: {
        READY_TO_SUBMIT_CONFIRMED: 'ready_to_submit',
        TEXT_INVALIDATED: 'text_prepared',
        TEMPLATE_SET: 'template_selected',
        INSTITUTION_SET: 'institution_selected',
        FILES_SELECTED_UPDATED: 'files_selected',
        PACKAGE_BUILT: 'package_ready',
        PACKAGE_BUILD_FAILED: 'failed',
        FAIL: 'failed',
        ARCHIVE: 'archived'
    },
    ready_to_submit: {
        SUBMISSION_MARKED_DONE: 'submitted_pending_fixation',
        TEXT_INVALIDATED: 'text_prepared',
        TEMPLATE_SET: 'template_selected',
        INSTITUTION_SET: 'institution_selected',
        FILES_SELECTED_UPDATED: 'files_selected',
        FAIL: 'failed',
        ARCHIVE: 'archived'
    },
    submitted_pending_fixation: {
        SUBMISSION_FIXATED: 'submitted',
        RESET_TO_STEP: 'ready_to_submit',
        SUBMISSION_FIXATION_FAILED: 'failed',
        FAIL: 'failed',
        ARCHIVE: 'archived'
    },
    submitted: {
        ARCHIVE: 'archived'
    },
    failed: {
        RETRY: 'case_created',
        RESET_TO_STEP: 'case_created',
        ARCHIVE: 'archived'
    },
    archived: {}
};
